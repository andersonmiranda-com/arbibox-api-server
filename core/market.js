"use strict";

const ccxt = require("ccxt");
const lodash = require("lodash");
const configs = require("../config/settings");
const colors = require("colors");
const z = require("zero-fill");
const n = require("numbro");

const arbitrage = require("./arbitrage");
const db = require("./db");

exports.initialize = async function() {
    try {
        console.info("\nLoading exchanges and tickets...");
        db.removeAllOpportunities();
        const { tickets, exchangesSymbols } = await prepareTickets();
        startArbitrageByExchange(tickets, exchangesSymbols);
        setInterval(function() {
            startArbitrageByExchange(tickets, exchangesSymbols);
        }, (configs.checkInterval > 0 ? configs.checkInterval : 1) * 60000);
        console.info("Bot started at", new Date());
    } catch (error) {
        console.error(colors.red("Error1:"), error.message);
    }
};

async function startArbitrageByExchange(tickets, exchangesSymbols) {
    try {
        let promises = exchangesSymbols.map(async exchange =>
            Promise.resolve(await fetchTickersByExchange(exchange))
        );

        Promise.all(promises)
            .then(
                async response => {
                    //console.log(tickets);
                    //console.log(response);

                    let counter = 0;

                    for (let ticket of tickets) {
                        let prices = [];

                        //console.log(ticket);
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
                            price.ticket = ticket.symbol;
                            price.cost = 0.0025; ///////////TODO: ler maket/taker do exchange
                            prices.push(price);
                            /* console.log(
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
                        //console.log(prices);
                        await arbitrage.checkOpportunity(prices);
                    }
                }

                //arbitrage.checkOpportunity(response);
            )
            .catch(error => {
                console.error(colors.red("Error2:"), error.message);
            });
    } catch (error) {
        console.error(colors.red("Error3:"), error.message);
    }
}

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
                timeout: configs.api_timeout * 1000
                //enableRateLimit: true
            });
            exchangeTickets.wallets = await _exchange.fetchBalance();
            db.saveWallets(exchangeTickets.id, {
                id: exchangeTickets.id,
                free: exchangeTickets.wallets.free,
                total: exchangeTickets.wallets.total
            });
        } else {
            _exchange = new ccxt[exchange.id]({
                timeout: configs.api_timeout * 1000
                //enableRateLimit: true
            });
            exchangeTickets.wallets = [];
        }

        exchangeTickets.tickets = await _exchange.fetchTickers(exchange.symbols);

        db.saveTickets(exchangeTickets.id, { id: exchangeTickets.id, id: exchangeTickets.tickets });

        //tickets.map(ticket => console.log(ticket));
    } catch (error) {
        console.error(colors.red("Error:"), error.message);
        return exchangeTickets;
    } finally {
        return exchangeTickets;
    }
}

async function prepareTickets() {
    let api = {};
    let exchanges = [];

    if (configs.filter.exchanges) {
        exchanges = configs.exchanges;
    } else {
        exchanges = ccxt.exchanges;
    }

    if (configs.filter.exchanges_blacklist) {
        exchanges = lodash.difference(exchanges, configs.exchanges_blacklist);
    }

    let checkedExchanges = [...exchanges];

    for (let i = 0; i < exchanges.length; i++) {
        let name = exchanges[i];
        console.log("Loading markets for", colors.green(name));
        try {
            var _instance;

            if (configs.keys[name]) {
                _instance = new ccxt[name]({
                    apiKey: configs.keys[name].apiKey,
                    secret: configs.keys[name].secret,
                    timeout: configs.api_timeout * 1000,
                    enableRateLimit: true
                });
            } else {
                _instance = new ccxt[name]({
                    timeout: configs.api_timeout * 1000,
                    enableRateLimit: true
                });
            }

            await _instance.loadMarkets();
            if (_instance.has["fetchTickers"]) {
                api[name] = _instance;
                //db.saveExchange(name, { symbols: _instance.symbols, markets: _instance.markets });
            } else {
                console.error(colors.red("Error: Exchange has no fetchTickers:"), name);
                checkedExchanges.splice(checkedExchanges.indexOf(name), 1);
            }
        } catch (error) {
            //console.error(colors.red("Error:"), error.message);
            console.error(colors.red("Error initiating:"), name);
            checkedExchanges.splice(checkedExchanges.indexOf(name), 1);
        }
    }

    exchanges = [...checkedExchanges];

    let symbols0 = [];
    let symbols = [];
    ccxt.unique(
        ccxt.flatten(
            exchanges.map(name => {
                if (!api[name]) console.log(name);
                return api[name] ? api[name].symbols : [];
            })
        )
    ).filter(symbol => {
        var coins = symbol.split("/");
        var is_base = false;
        var is_quote = false;

        is_base = lodash.includes(configs.base_currencies, coins[0]);
        is_quote = lodash.includes(configs.quote_currencies, coins[1]);

        if (configs.filter.base_currencies && configs.filter.quote_currencies) {
            if (is_base && is_quote) {
                symbols.push(symbol);
            }
        } else if (configs.filter.base_currencies) {
            if (is_base) {
                symbols.push(symbol);
            }
        } else if (configs.filter.quote_currencies) {
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

    //console.log(symbols);
    //console.log(symbols.length);

    let exchangesSymbols = [];

    for (let name of exchanges) {
        exchangesSymbols.push({ id: name, symbols: [] });
    }

    let tickets = arbitrables.map(symbol => {
        //console.log(symbol);
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

    //console.log(tickets);

    console.info(
        "Exchanges:",
        colors.green(exchanges.length),
        "| Tickets:",
        colors.green(tickets.length)
    );
    return { tickets, exchangesSymbols };
}
