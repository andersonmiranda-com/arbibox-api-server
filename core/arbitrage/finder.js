const ccxt = require("ccxt");
const lodash = require("lodash");
const configs = require("../../config/settings");
const colors = require("colors");
const util = require("util");
const z = require("zero-fill");

const db = require("../db");

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// Prepare Tickets
///

const initialize = async function() {
    //initialize oppotunities table
    db.removeAllOpportunities();
    //get withdrawal fees
    db.getWithdrawalFees(function(response) {
        global.withdrawalFees = response;
    });
    let api = {};
    let exchanges = [];

    if (configs.marketFilter.exchanges) {
        exchanges = configs.exchanges;
    } else {
        exchanges = ccxt.exchanges;
    }

    if (configs.marketFilter.exchangesBlacklist) {
        exchanges = lodash.difference(exchanges, configs.exchangesBlacklist);
    }

    let checkedExchanges = [...exchanges];

    for (let i = 0; i < exchanges.length; i++) {
        let name = exchanges[i];
        verbose && console.log("Loading markets for", colors.green(name));
        try {
            var _instance;

            if (configs.keys[name]) {
                _instance = new ccxt[name]({
                    apiKey: configs.keys[name].apiKey,
                    secret: configs.keys[name].secret,
                    timeout: configs.apiTimeout * 1000,
                    enableRateLimit: true
                });
            } else {
                _instance = new ccxt[name]({
                    timeout: configs.apiTimeout * 1000,
                    enableRateLimit: true
                });
            }

            await _instance.loadMarkets();

            //CCXT API Exchange validation
            if (!_instance.has["fetchTickers"]) {
                verbose && console.error(colors.red("Error: Exchange has no fetchTickers:"), name);
                checkedExchanges.splice(checkedExchanges.indexOf(name), 1);
            } else if (!_instance.has["fetchOrderBook"]) {
                verbose &&
                    console.error(colors.red("Error: Exchange has no fetchOrderBook:"), name);
                checkedExchanges.splice(checkedExchanges.indexOf(name), 1);
            } else if (!_instance.has["fetchTrades"]) {
                verbose && console.error(colors.red("Error: Exchange has no fetchTrades:"), name);
                checkedExchanges.splice(checkedExchanges.indexOf(name), 1);
            } else if (!_instance.has["withdraw"]) {
                verbose && console.error(colors.red("Error: Exchange has no withdraw:"), name);
                checkedExchanges.splice(checkedExchanges.indexOf(name), 1);
            } else {
                api[name] = _instance;
                //db.saveExchange(name, { symbols: _instance.symbols, markets: _instance.markets });
            }
        } catch (error) {
            //verbose && console.error(colors.red("Error:"), error.message);
            verbose && console.error(colors.red("Error initiating:"), name);
            checkedExchanges.splice(checkedExchanges.indexOf(name), 1);
        }
    }

    exchanges = [...checkedExchanges];

    let symbols0 = [];
    let symbols = [];
    ccxt.unique(
        ccxt.flatten(
            exchanges.map(name => {
                if (!api[name]) verbose && console.log(name);
                return api[name] ? api[name].symbols : [];
            })
        )
    ).filter(symbol => {
        var coins = symbol.split("/");
        var is_base = false;
        var is_quote = false;

        is_base = lodash.includes(configs.baseCurrencies, coins[0]);
        is_quote = lodash.includes(configs.quoteCurrencies, coins[1]);

        if (configs.marketFilter.baseCurrencies && configs.marketFilter.quoteCurrencies) {
            if (is_base && is_quote) {
                symbols.push(symbol);
            }
        } else if (configs.marketFilter.baseCurrencies) {
            if (is_base) {
                symbols.push(symbol);
            }
        } else if (configs.marketFilter.quoteCurrencies) {
            if (is_quote) {
                symbols.push(symbol);
            }
        } else {
            symbols.push(symbol);
        }
    });

    let arbitrables = symbols
        .filter(
            symbol => exchanges.filter(name => api[name].symbols.indexOf(symbol) >= 0).length > 1
        )
        .sort((id1, id2) => (id1 > id2 ? 1 : id2 > id1 ? -1 : 0));

    //verbose && console.log(symbols);
    //verbose && console.log(symbols.length);

    let exchangesSymbols = [];

    for (let name of exchanges) {
        exchangesSymbols.push({ id: name, symbols: [] });
    }

    let tickets = arbitrables.map(symbol => {
        //verbose && console.log(symbol);
        let row = {
            symbol,
            exchanges: []
        };

        for (let name of exchanges) {
            if (api[name].symbols.indexOf(symbol) >= 0) {
                //append ticket to exchangesSYmbols list
                exchangesSymbols.find(exch => exch.id === name).symbols.push(symbol);
                //                exchangesSymbols[name].symbols.push(symbol);
                row.exchanges.push(name);
            }
        }
        return row;
    });

    //verbose && console.log(tickets);

    verbose &&
        console.info(
            "Exchanges:",
            colors.green(exchanges.length),
            "| Tickets:",
            colors.green(tickets.length)
        );
    return { tickets, exchangesSymbols };
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
///
///

async function findOpportunities(tickets, exchangesSymbols) {
    try {
        let promises = exchangesSymbols.map(async exchange =>
            Promise.resolve(await fetchTickersByExchange(exchange))
        );

        Promise.all(promises)
            .then(
                async response => {
                    //verbose && console.log(tickets);
                    //verbose && console.log(response);

                    let counter = 0;

                    for (let ticket of tickets) {
                        let prices = [];

                        //verbose && console.log(ticket);
                        counter++;

                        for (let exchange of ticket.exchanges) {
                            let price = {};

                            let exchangeData = response.find(exch => exch.id === exchange);
                            let exchangePrices = exchangeData.tickets[ticket.symbol] || {};
                            let exchangeWallets = exchangeData.wallets || [];

                            price.bid = exchangePrices.bid;
                            price.ask = exchangePrices.ask;
                            price.baseVolume = exchangePrices.baseVolume;
                            price.quoteVolume = exchangePrices.quoteVolume;
                            price.name = exchange;
                            price.symbol = ticket.symbol;
                            price.cost = 0.0025; ///////////TODO: ler maket/taker do exchange
                            prices.push(price);
                            /* verbose && console.log(
                                z(5, counter, " "),
                                z(13, exchange, " "),
                                ":",
                                z(9, ticket.symbol, " "),
                                ":",
                                "bid:",
                                colors.green(z(16, n(price.bid).format("0.00000000"), " ")),
                                "|",
                                "ask:",
                                colors.red(z(16, n(price.ask).format("0.00000000"), " ")),
                                "|",
                                "baseVolume:",
                                z(16, n(price.baseVolume).format("0.0000"), " "),
                                "|",
                                "quoteVolume:",
                                z(16, n(price.quoteVolume).format("0.0000"), " ")
                            ); */
                        }
                        //verbose && console.log(prices);
                        filterOpportunities(prices);
                    }
                }

                //arbitrage.checkOpportunity(response);
            )
            .catch(error => {
                verbose && console.error(colors.red("Error2:"), error.message);
            });
    } catch (error) {
        verbose && console.error(colors.red("Error3:"), error.message);
    }
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
///
///

async function fetchTickersByExchange(exchange) {
    var exchangeTickets = {
        id: exchange.id,
        tickets: [],
        wallets: []
    };

    try {
        var _exchange;

        if (configs.keys[exchange.id]) {
            _exchange = new ccxt[exchange.id]({
                apiKey: configs.keys[exchange.id].apiKey,
                secret: configs.keys[exchange.id].secret,
                timeout: configs.apiTimeout * 1000,
                enableRateLimit: true
            });
            exchangeTickets.wallets = await _exchange.fetchBalance();
            db.saveWallets(exchangeTickets.id, {
                id: exchangeTickets.id,
                free: exchangeTickets.wallets.free,
                total: exchangeTickets.wallets.total
            });
        } else {
            _exchange = new ccxt[exchange.id]({
                timeout: configs.apiTimeout * 1000,
                enableRateLimit: true
            });
            exchangeTickets.wallets = [];
        }

        exchangeTickets.tickets = await _exchange.fetchTickers(exchange.symbols);

        db.saveTickets(exchangeTickets.id, {
            id: exchangeTickets.id,
            tickets: exchangeTickets.tickets
        });

        //tickets.map(ticket => verbose && console.log(ticket));
    } catch (error) {
        verbose && console.error(colors.red("Error:"), error.message);
        return exchangeTickets;
    } finally {
        return exchangeTickets;
    }
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// Find best opportiunities (Calculates profit for each group of tickets
///
/// Input: prices: an array of objects with ask/bid of each exchange all with the same ticket
///
/// Output: saves
///

function filterOpportunities(prices) {
    return new Promise(async (resolve, reject) => {
        let opportunities = [];
        let { baseCurrency, quoteCurrency } = getCurrencies(prices[0]);
        db.removeOldOpportunitiesBySymbol(prices[0].symbol);
        for (let priceAsk of prices) {
            if (
                configs.quality.filter.lowVolume &&
                (!priceAsk.baseVolume ||
                    !priceAsk.quoteVolume ||
                    priceAsk.baseVolume <= configs.quality.filter.baseLowVolumeLimit ||
                    priceAsk.quoteVolume <=
                        configs.quality.filter.quoteLowVolumeLimit[quoteCurrency])
            ) {
                continue;
            }
            for (let priceBid of prices) {
                if (
                    configs.quality.filter.lowVolume &&
                    (!priceBid.baseVolume ||
                        !priceBid.quoteVolume ||
                        priceBid.baseVolume <= configs.quality.filter.baseLowVolumeLimit ||
                        priceBid.quoteVolume <=
                            configs.quality.filter.quoteLowVolumeLimit[quoteCurrency])
                ) {
                    continue;
                }
                if (priceAsk.ask < priceBid.bid) {
                    opportunities.push({ bestAsk: priceAsk, bestBid: priceBid });
                    //verbose && console.log("\n\nbestBid:", priceBid);
                    //verbose && console.log("bestAsk:", priceAsk);
                }
            }
        }

        for (let op of opportunities) {
            let { bestAsk, bestBid } = op;

            let percentage = getPercentage(bestAsk, bestBid);

            let baseWithdrawalFee = getWithdrawalFee(baseCurrency);
            let quoteWithdrawalFee = getWithdrawalFee(quoteCurrency);

            let percentageAfterWdFees1 = getPercentageAfterWdFees(
                configs.quality.quoteCurrencyFunds[quoteCurrency],
                bestAsk,
                bestBid
            );
            if (percentageAfterWdFees1 >= configs.opportunity.minimumProfit) {
                let { minQuote, minBase } = getMinimunInversion(bestAsk, bestBid);
                let percentageAfterWdFees2 = getPercentageAfterWdFees(minQuote, bestAsk, bestBid);
                let opportunity = {
                    id: bestAsk.symbol.toLowerCase() + "-" + bestAsk.name + "-" + bestBid.name,
                    created_at: new Date(),
                    symbol: bestAsk.symbol,
                    type: "AP",
                    buy_at: bestAsk.name,
                    buy: {
                        at: bestAsk.name,
                        ask: bestAsk.ask,
                        volume_base: bestAsk.baseVolume,
                        volume_quote: bestAsk.quoteVolume,
                        wd_fee_quote: quoteWithdrawalFee
                    },

                    sell_at: bestBid.name,
                    sell: {
                        at: bestBid.name,
                        bid: bestBid.bid,
                        volume_base: bestBid.baseVolume,
                        volume_quote: bestBid.quoteVolume,
                        wd_fee_base: baseWithdrawalFee
                    },

                    invest_min: {
                        base: minBase,
                        quote: minQuote,
                        profit_min: Number(percentageAfterWdFees2.toFixed(4))
                    },
                    //bids: bidOrders.bids,
                    invest: configs.quality.quoteCurrencyFunds[quoteCurrency],
                    profit0: Number(percentage.toFixed(4)),
                    profit1: Number(percentageAfterWdFees1.toFixed(4))
                };

                verbose &&
                    console.info(
                        "✔".cyan,
                        colors.green(percentageAfterWdFees1.toFixed(4)),
                        "% ",
                        colors.yellow(z(9, opportunity.symbol, " ")),
                        z(10, opportunity.buy_at, " "),
                        z(10, opportunity.sell_at, " ")
                    );

                // verbose &&
                //     console.info(
                //         "\n",
                //         util.inspect(opportunity, {
                //             colors: true
                //         })
                //     );
                db.upsertOpportunity(opportunity);
            }
        }
        resolve();
    });
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
///
///

function getWithdrawalFee(currency) {
    let wd = withdrawalFees.find(fee => fee.coin === currency);
    return wd ? wd.withdrawalFee : 0;
}

function getPercentage(bestAsk, bestBid) {
    let { baseCurrency, quoteCurrency } = getCurrencies(bestAsk);

    let funds = configs.quality.quoteCurrencyFunds[quoteCurrency];
    let amount = funds / bestAsk.ask;

    let bought = bestAsk.ask * amount;
    let sould = bestBid.bid * amount;

    let cost = bought * bestAsk.cost + sould * bestBid.cost;

    let estimatedGain = sould - (bought + cost);
    let percentage = (estimatedGain / funds) * 100;
    return percentage;
}

function getPercentageAfterWdFees(funds, bestAsk, bestBid) {
    let { baseCurrency, quoteCurrency } = getCurrencies(bestAsk);

    let baseWithdrawalFee = getWithdrawalFee(baseCurrency);
    let quoteWithdrawalFee = getWithdrawalFee(quoteCurrency);

    let bought = (funds / bestAsk.ask) * (1 - bestAsk.cost);
    let sould =
        (bought - baseWithdrawalFee) * bestBid.bid * (1 - bestBid.cost) - quoteWithdrawalFee;

    let estimatedGain = sould - funds; // Math.abs to make possible interpolation with goalSeek
    let percentage = (estimatedGain / Math.abs(funds)) * 100;

    let perc1 =
        (100 *
            (bestBid.bid *
                ((funds * (-bestAsk.cost + 1)) / bestAsk.ask - baseWithdrawalFee) *
                (-bestBid.cost + 1) -
                quoteWithdrawalFee -
                funds)) /
        funds;
    return percentage;
}

function getMinimunInversion(bestAsk, bestBid) {
    let { baseCurrency, quoteCurrency } = getCurrencies(bestAsk);

    let baseWithdrawalFee = getWithdrawalFee(baseCurrency);
    let quoteWithdrawalFee = getWithdrawalFee(quoteCurrency);

    // this formula was generated using HP Prime Calculator solve function
    // P
    //p=(100 * (bid * ((x * (-fa + 1)) / ask - wfb) * (-fb + 1) - wfq - x)) / x;

    //solve(p=profit,x)
    /*
    {
        (-100 * ask * bid * fb * wfb + 100 * ask * bid * wfb + 100 * ask * wfq) /
            (100 * bid * fa * fb -
                ask * profit -
                100 * bid * fa -
                100 * bid * fb -
                100 * ask +
                100 * bid);
    }
    */

    let minQuote =
        (-100 * bestAsk.ask * bestBid.bid * bestBid.cost * baseWithdrawalFee +
            100 * bestAsk.ask * bestBid.bid * baseWithdrawalFee +
            100 * bestAsk.ask * quoteWithdrawalFee) /
        (100 * bestBid.bid * bestAsk.cost * bestBid.cost -
            bestAsk.ask * configs.opportunity.minimumProfitInvest -
            100 * bestBid.bid * bestAsk.cost -
            100 * bestBid.bid * bestBid.cost -
            100 * bestAsk.ask +
            100 * bestBid.bid);

    let minBase = (minQuote / bestAsk.ask) * (1 - bestAsk.cost) - baseWithdrawalFee;

    return { minQuote, minBase };
}

function getCurrencies(price) {
    let coins = price.symbol.split("/");
    let baseCurrency = coins[0];
    let quoteCurrency = coins[1];
    return { baseCurrency, quoteCurrency };
}

module.exports = {
    initialize,
    findOpportunities
};
