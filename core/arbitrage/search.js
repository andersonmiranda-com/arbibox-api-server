const ccxt = require("ccxt");
var moment = require("moment");

const lodash = require("lodash");
const colors = require("colors");
const z = require("zero-fill");

const configs = require("../../config/settings-arbitrage");
const quality = require("./quality");
const updateFees = require("./updateFees");

const {
    getWithdrawalFee,
    getPercentage,
    getPercentageAfterWdFees,
    getMinimunInversion,
    getCurrencies
} = require("./common");

const { fetchTickers } = require("../exchange");
const db = require("../db");

global.api = {};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// Prepare Tickets
///

const initialize = async function() {
    //initialize oppotunities table
    db.removeOpportunities({ type: "PA" });

    //get withdrawal fees
    global.withdrawalFees = await db.getWithdrawalFees();
    if (withdrawalFees.length === 0) {
        updateFees.initialize();
    }

    let exchanges = [];
    let markets = [];

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

        var start1 = new Date();
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
            var end1 = new Date() - start1;

            verbose && console.log("Loading markets for", colors.green(name), "-", end1, "ms");

            //Exchange withdrawal fees validation
            let wd = withdrawalFees.find(fee => fee.exchange === name);
            if (!wd) {
                verbose &&
                    console.error(
                        colors.red("Error: Exchange has no withdrawal fees in database:"),
                        name
                    );
                checkedExchanges.splice(checkedExchanges.indexOf(name), 1);
            }

            //CCXT API Exchange validation
            else if (!_instance.has["fetchTickers"]) {
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
                markets.push({ id: name, markets: _instance.markets });
                api[name] = _instance;
                //db.saveExchange(name, { symbols: _instance.symbols, markets: _instance.markets });
            }
        } catch (error) {
            verbose && console.error(colors.red("Error initiating:"), name);
            verbose && console.error(colors.red("Error:"), error.message);
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
    return { tickets, exchangesSymbols, markets };
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
///
///

async function findOpportunities(tickets, exchangesSymbols, markets, searchCounter) {
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
                            let exchangeMarkets = markets.find(market => market.id === exchange)
                                .markets;

                            let exchangePrices = exchangeData.tickets[ticket.symbol] || {};
                            let exchangeWallets = exchangeData.wallets || [];

                            price.bid = exchangePrices.bid;
                            price.ask = exchangePrices.ask;
                            price.baseVolume = exchangePrices.baseVolume;
                            price.quoteVolume = exchangePrices.quoteVolume;
                            price.name = exchange;
                            price.symbol = ticket.symbol;
                            price.tradeFee = exchangeMarkets[ticket.symbol].taker || 0.0026; // catchall if taker fee is not found
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

                    console.info(
                        "S >> Scan " + searchCounter + " finished >",
                        moment().format("dddd, MMMM D YYYY, h:mm:ss a")
                    );
                }

                //arbitrage.checkOpportunity(response);
            )
            .catch(error => {
                verbose && console.error(colors.red("S >> Error2:"), error.message);
            });
    } catch (error) {
        verbose && console.error(colors.red("S >> Error3:"), error.message);
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

    exchangeTickets.tickets = await fetchTickers(exchange.id);
    return exchangeTickets;
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

        for (let priceAsk of prices) {
            if (
                configs.quality.filter.tickerVolume &&
                (!priceAsk.baseVolume ||
                    !priceAsk.quoteVolume ||
                    priceAsk.baseVolume <= configs.quality.filter.tickerLowVolumeLimit.base ||
                    priceAsk.quoteVolume <=
                        configs.quality.filter.tickerLowVolumeLimit.quote[quoteCurrency])
            ) {
                continue;
            }
            for (let priceBid of prices) {
                if (
                    configs.quality.filter.tickerVolume &&
                    (!priceBid.baseVolume ||
                        !priceBid.quoteVolume ||
                        priceBid.baseVolume <= configs.quality.filter.tickerLowVolumeLimit.base ||
                        priceBid.quoteVolume <=
                            configs.quality.filter.tickerLowVolumeLimit.quote[quoteCurrency])
                ) {
                    continue;
                }

                // console.log(
                //     "S >>>",
                //     priceAsk.symbol,
                //     priceAsk.name,
                //     priceAsk.ask,
                //     priceBid.name,
                //     priceBid.bid
                // );

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

            bestAsk.baseWithdrawalFee = getWithdrawalFee(bestAsk.name, baseCurrency);
            bestBid.quoteWithdrawalFee = getWithdrawalFee(bestBid.name, quoteCurrency);

            let percentageAfterWdFees1 = getPercentageAfterWdFees(
                configs.search.quoteCurrencyFunds[quoteCurrency],
                bestAsk,
                bestBid
            );

            //console.log("S >>", bestAsk.symbol, bestAsk.name, bestBid.name, percentageAfterWdFees1);

            if (
                percentageAfterWdFees1 >= configs.search.minimumProfit &&
                percentageAfterWdFees1 < 100 &&
                percentageAfterWdFees1 !== Infinity
            ) {
                let { minQuote, minBase } = getMinimunInversion(bestAsk, bestBid);
                let percentageAfterWdFees2 = getPercentageAfterWdFees(minQuote, bestAsk, bestBid);
                let opportunity = {
                    id: bestAsk.symbol.toLowerCase() + "-" + bestAsk.name + "-" + bestBid.name,
                    opp_created_at: new Date(),
                    type: "PA",
                    symbol: bestAsk.symbol,
                    buy_at: bestAsk.name,
                    sell_at: bestBid.name,
                    profit: Number(percentageAfterWdFees1.toFixed(4)),
                    bestAsk: bestAsk,
                    bestBid: bestBid,
                    invest: {
                        //calc: configs.search.quoteCurrencyFunds[quoteCurrency],
                        min: {
                            base: minBase,
                            quote: minQuote,
                            profit_min: Number(percentageAfterWdFees2.toFixed(4))
                        }
                    }
                };

                verbose &&
                    console.info(
                        "S >>",
                        colors.green(percentageAfterWdFees1.toFixed(4)),
                        "% ",
                        z(9, opportunity.symbol, " "),
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

                quality.checkOpportunity(opportunity);
            }
        }
        resolve();
    });
}

module.exports = {
    initialize,
    findOpportunities
};
