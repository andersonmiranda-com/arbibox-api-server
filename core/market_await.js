"use strict";

const ccxt = require("ccxt");
const lodash = require("lodash");
const configs = require("../config/settings");
const arbitrage = require("./arbitrage");
const colors = require("colors");
const z = require("zero-fill");
const n = require("numbro");

var prices = [];

exports.initialize = async function() {
    try {
        console.info("\nLoading exchanges and tickets...");
        const tickets = await prepareTickets();
        console.info("Bot started at", new Date());
        for (let ticket of tickets) {
            prices = [];
            await startArbitrageByTicket(ticket);
        }
    } catch (error) {
        console.error(colors.red("Error1:"), error.message);
    }
};

async function startArbitrageByTicket(ticket) {
    for (let exchange of ticket.exchanges) {
        let response = await fetchDataByTicketAndExchange(ticket.symbol, exchange);
        prices.push(response);
        arbitrage.checkOpportunity(prices);
    }
}

async function fetchDataByTicketAndExchange(ticket, exchangeName) {
    let result = {
        name: exchangeName,
        ticket: ticket,
        cost: 0.001,
        bid: 0,
        ask: 0
    };

    var exchange;

    try {
        var exchange;

        if (configs.keys[exchangeName]) {
            exchange = new ccxt[exchangeName]({
                apiKey: configs.keys[exchangeName].apiKey,
                secret: configs.keys[exchangeName].secret,
                timeout: configs.api_timeout * 1000,
                enableRateLimit: true
            });
        } else {
            exchange = new ccxt[exchangeName]({
                timeout: configs.api_timeout * 1000,
                enableRateLimit: true
            });
        }

        //console.log("---- get market ----", exchangeName, ticket);

        const market = await exchange.fetchTicker(ticket);

        if (market != undefined && market != null) {
            result.bid = market.bid;
            result.ask = market.ask;
            result.baseVolume = market.baseVolume || 0;
            result.quoteVolume = market.quoteVolume || 0;

            //result.date = new Date();

            //console.log("");
            //console.log("----market----", market);

            console.log(
                z(13, exchangeName, " "),
                ":",
                z(9, ticket, " "),
                ":",
                "bid:",
                colors.green(z(16, n(result.bid).format("0.00000000"), " ")),
                "|",
                "ask:",
                colors.red(z(16, n(result.ask).format("0.00000000"), " ")),
                "|",
                "baseVolume:",
                z(16, n(result.baseVolume).format("0.0000"), " "),
                "|",
                "quoteVolume:",
                z(16, n(result.quoteVolume).format("0.0000"), " ")
            );
        } else {
            console.log("---- market NULL ----", exchangeName, ticket);
        }
    } catch (error) {
        //    console.error(colors.red("Error:"), error.message);
    } finally {
        return result;
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
            api[name] = _instance;
        } catch (error) {
            //console.error(colors.red("Error:"), error.message);
            console.error(colors.red("Error (cannot open API):"), name);
            checkedExchanges.splice(checkedExchanges.indexOf(name), 1);
        }
    }

    exchanges = [...checkedExchanges];

    let symbols0 = [];
    let symbols = [];
    ccxt.unique(
        ccxt.flatten(
            exchanges.map(name => {
                return api[name].symbols;
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

    let tickets = arbitrables.map(symbol => {
        //console.log(symbol);
        let row = {
            symbol,
            exchanges: []
        };
        for (let name of exchanges)
            if (api[name].symbols.indexOf(symbol) >= 0) row.exchanges.push(name);
        return row;
    });

    //console.log(tickets);

    console.info(
        "Exchanges:",
        colors.green(exchanges.length),
        "| Tickets:",
        colors.green(tickets.length)
    );
    return tickets;
}
