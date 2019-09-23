const ccxt = require("ccxt");
var moment = require("moment");
const lodash = require("lodash");
const colors = require("colors");
const z = require("zero-fill");

const { configs } = require("./settings");
const { apiKeys } = require("./settingsApiKeys");
const quality = require("./quality");
const updateFees = require("./updateFees");

const {
    getWithdrawalFee,
    getPercentage,
    getPercentageAfterWdFees,
    getMinimunInversion,
    getCurrencies
} = require("./common");

const { fetchTickers, getCurrenciesCMC } = require("../exchange");
const db = require("../db");

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// Prepare Tickets
///

const initialize = async function() {
    //initialize signals table
    db.removeSignals({ type: "PA" });

    //get withdrawal fees
    global.withdrawalFees = await db.getWithdrawalFees();
    if (withdrawalFees.length === 0) {
        updateFees.initialize();
    }

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

            if (apiKeys[name]) {
                _instance = new ccxt[name]({
                    apiKey: apiKeys[name].apiKey,
                    secret: apiKeys[name].secret,
                    password: apiKeys[name].password || null,
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
                        colors.yellow("Warning: Exchange has no withdrawal fees in database:"),
                        name
                    );
                //    checkedExchanges.splice(checkedExchanges.indexOf(name), 1);
            }
            //else

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
            } else if (
                !_instance.has["fetchDepositAddress"] &&
                !_instance.has["createDepositAddress"]
            ) {
                verbose &&
                    console.error(
                        colors.red(
                            "Error: Exchange has no fetchDepositAddress / createDepositAddress:"
                        ),
                        name
                    );
                //checkedExchanges.splice(checkedExchanges.indexOf(name), 1);
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

    //console.log(exchanges);

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /// Prepare Currencies

    let baseCurrencies = [];
    let filterbaseCurrencies = false;

    if (configs.marketFilter.baseCurrenciesCMC) {
        try {
            console.info(
                colors.yellow("S >>"),
                "Getting top",
                configs.marketFilter.baseCurrenciesCMCQty,
                "currencies from CoinMarketCap"
            );
            baseCurrencies = await getCurrenciesCMC();
            filterbaseCurrencies = true;
            verbose && console.info(colors.green("S >> Coins:"), baseCurrencies);
        } catch (error) {
            verbose &&
                console.error(
                    colors.red("S >>"),
                    "Unable to fetch top currencies from CoinMarketCap. Using 'baseCurrenciesFromList' filter"
                );
            if (configs.marketFilter.baseCurrenciesFromList) {
                baseCurrencies = configs.baseCurrencies;
                filterbaseCurrencies = true;
            }
        }
    } else if (configs.marketFilter.baseCurrenciesFromList) {
        baseCurrencies = configs.baseCurrencies;
        filterbaseCurrencies = true;
    }

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /// Prepare Symbols

    let symbols = [];

    lodash
        .uniq(
            lodash.flatten(
                exchanges.map(name => {
                    if (!api[name]) verbose && console.log("API not loaded:", name);
                    return api[name] ? api[name].symbols : [];
                })
            )
        )
        .filter(symbol => {
            var coins = symbol.split("/");
            var is_base = false;
            var is_quote = false;

            is_base = lodash.includes(baseCurrencies, coins[0]);
            is_quote = lodash.includes(configs.quoteCurrencies, coins[1]);

            if (
                configs.marketFilter.currenciesBlacklist &&
                (lodash.includes(configs.currenciesBlacklist, coins[0]) ||
                    lodash.includes(configs.currenciesBlacklist, coins[1]))
            ) {
                // do not push symbol if in blacklist
                verbose && console.log("S >>", "Blacklisted symbol", colors.magenta(symbol));
            } else if (filterbaseCurrencies && configs.marketFilter.quoteCurrencies) {
                if (is_base && is_quote) {
                    symbols.push(symbol);
                }
            } else if (filterbaseCurrencies) {
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

async function findSignals(tickets, exchangesSymbols, markets, searchCounter) {
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
                    let approvedSignals = [];

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
                            price.minAmount = exchangeMarkets[ticket.symbol].limits.amount.min;
                            price.minCost =
                                exchangeMarkets[ticket.symbol].limits.cost.min || 0.0001;
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
                        signals = await filterSignals(prices);
                        if (signals.length !== 0) approvedSignals.push(signals);
                    }

                    await db.addSignals(lodash.flatten(approvedSignals));
                    cleanup();

                    console.info(
                        "S >> Scan " + searchCounter + " finished >",
                        moment().format("dddd, MMMM D YYYY, h:mm:ss a")
                    );
                }

                //arbitrage.checkSignal(response);
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
/// Find best signals (Calculates profit for each group of tickets
///
/// Input: prices: an array of objects with ask/bid of each exchange all with the same ticket
///
/// Output: saves
///

function filterSignals(prices) {
    return new Promise(async (resolve, reject) => {
        let signals = [];
        let approvedSignals = [];

        let { baseCurrency, quoteCurrency } = getCurrencies(prices[0]);

        for (let priceAsk of prices) {
            if (
                configs.search.filter.tickerVolume &&
                (!priceAsk.baseVolume ||
                    !priceAsk.quoteVolume ||
                    priceAsk.quoteVolume <=
                        configs.search.filter.tickerLowVolumeLimit.quote[quoteCurrency])
            ) {
                continue;
            }
            for (let priceBid of prices) {
                if (
                    configs.search.filter.tickerVolume &&
                    (!priceBid.baseVolume ||
                        !priceBid.quoteVolume ||
                        priceBid.quoteVolume <=
                            configs.search.filter.tickerLowVolumeLimit.quote[quoteCurrency])
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
                    signals.push({ bestAsk: priceAsk, bestBid: priceBid });
                    //verbose && console.log("\n\nbestBid:", priceBid);
                    //verbose && console.log("bestAsk:", priceAsk);
                }
            }
        }

        for (let op of signals) {
            let { bestAsk, bestBid } = op;

            let profitPercent = getPercentage(bestAsk, bestBid);

            bestAsk.baseWithdrawalFee = getWithdrawalFee(bestAsk.name, baseCurrency);
            bestBid.quoteWithdrawalFee = getWithdrawalFee(bestBid.name, quoteCurrency);

            let profitPercentAfterWdFees = getPercentageAfterWdFees(
                configs.search.quoteCurrencyFunds[quoteCurrency],
                bestAsk,
                bestBid
            );

            let percentReference = configs.loopWithdraw ? profitPercentAfterWdFees : profitPercent;
            //console.log("S >>", bestAsk.symbol, bestAsk.name, bestBid.name, profitPercentAfterWdFees);

            if (
                percentReference >= configs.search.minimumProfit &&
                //percentReference < 200 &&
                percentReference !== Infinity
            ) {
                let timeBlock = Math.floor(moment().unix() / (configs.search.signalTimeBlock * 60));

                let buy_at_low_volume =
                    !bestAsk.quoteVolume ||
                    bestAsk.quoteVolume <=
                        configs.search.filter.tickerLowVolumeLimit.quote[quoteCurrency];

                let sell_at_low_volume =
                    !bestBid.quoteVolume ||
                    bestBid.quoteVolume <=
                        configs.search.filter.tickerLowVolumeLimit.quote[quoteCurrency];

                let signal = {
                    code: bestAsk.symbol.toUpperCase() + "-" + bestAsk.name + "-" + bestBid.name,
                    time_block: timeBlock,
                    signal_created_at: new Date(),
                    type: "PA",
                    symbol: bestAsk.symbol,
                    base: baseCurrency,
                    quote: quoteCurrency,
                    buy_at: bestAsk.name,
                    ask: bestAsk.ask,
                    buy_at_low_volume: buy_at_low_volume,
                    sell_at: bestBid.name,
                    bid: bestBid.bid,
                    sell_at_low_volume: sell_at_low_volume,
                    //profit_loop_percent: Number(profitPercentAfterWdFees.toFixed(4)),
                    profit_percent: Number(profitPercent.toFixed(4)),
                    bestAsk: bestAsk,
                    bestBid: bestBid
                };

                if (configs.loopWithdraw) {
                    let { minQuote, minBase } = getMinimunInversion(bestAsk, bestBid);

                    let profitPercentAfterWdFeesMin = getPercentageAfterWdFees(
                        minQuote,
                        bestAsk,
                        bestBid
                    );

                    signal.invest = {
                        min: {
                            base: minBase,
                            quote: minQuote,
                            profit_min: Number(profitPercentAfterWdFeesMin.toFixed(4))
                        }
                    };
                } else {
                    signal.invest = {};
                }

                verbose &&
                    console.info(
                        "S >>",
                        colors.green(percentReference.toFixed(4)),
                        "% ",
                        z(9, signal.symbol, " "),
                        z(10, signal.buy_at, " "),
                        z(10, signal.sell_at, " ")
                    );

                // verbose &&
                //     console.info(
                //         "\n",
                //         util.inspect(signal, {
                //             colors: true
                //         })
                //     );

                //quality.checkSignal(signal);

                approvedSignals.push(signal);
            }
        }
        resolve(approvedSignals);
    });
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// Remove old and stucked signals
///

const cleanup = async function() {
    ////////
    // remove signals created some time ago - wich does not have upadates
    ////////

    const timeBlock = Math.floor(moment().unix() / (configs.search.signalTimeBlock * 60));
    db.removeSignals({ $and: [{ time_block: { $lt: timeBlock } }, { type: "PA" }] });
};

module.exports = {
    initialize,
    findSignals,
    cleanup
};
