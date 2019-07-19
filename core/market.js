"use strict";

const ccxt = require("ccxt");
const configs = require("../config/settings");
const arbitrage = require("./arbitrage");
const colors = require("colors");

exports.initialize = async function() {
    try {
        console.info("\nLoading exchanges and tickets...");
        const tickets = await prepareTickets();
        for (let ticket of tickets) {
            startArbitrageByTicket(ticket);
            setInterval(function() {
                startArbitrageByTicket(ticket);
            }, (configs.arbitrage.checkInterval > 0 ? configs.arbitrage.checkInterval : 1) * 60000);
        }
        console.info("Bot started.");
    } catch (error) {
        console.error(colors.red("Error:"), error.message);
    }
};

async function startArbitrageByTicket(ticket) {
    try {
        let promises = ticket.exchanges.map(async exchange =>
            Promise.resolve(await fetchDataByTicketAndExchange(ticket.symbol, exchange))
        );

        Promise.all(promises)
            .then(response => {
                arbitrage.checkOpportunity(response);
            })
            .catch(error => {
                console.error(colors.red("Error:"), error.message);
            });
    } catch (error) {
        console.error(colors.red("Error:"), error.message);
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

    try {
        const exchange = new ccxt[exchangeName]();
        const market = await exchange.fetchTicker(ticket);
        if (market != undefined && market != null) {
            result.bid = market.bid;
            result.ask = market.ask;

            //console.log("");
            //console.log(market);

            // console.info(
            //     exchangeName,
            //     ":",
            //     ticket,
            //     ":",
            //     "bid:",
            //     colors.green(result.bid),
            //     "|",
            //     "ask:",
            //     colors.green(result.ask)
            // );
        }
    } catch (error) {
    } finally {
        return result;
    }
}

async function prepareTickets() {
    let api = {};
    let exchanges = [];

    if (configs.arbitrage.filter.exchanges) {
        exchanges = configs.arbitrage.exchanges;
    } else {
        exchanges = ccxt.exchanges;
    }

    for (let i = exchanges.length - 1; i >= 0; i--) {
        let name = exchanges[i];
        console.log(name);
        try {
            let _instance = new ccxt[name]();
            await _instance.loadMarkets();
            api[name] = _instance;
        } catch (error) {
            console.error(colors.red("Error:"), error.message);
            exchanges.splice(exchanges.indexOf(name), 1);
        }
    }

    let symbols = [];
    ccxt.unique(
        ccxt.flatten(
            exchanges.map(name => {
                return api[name].symbols;
            })
        )
    ).filter(symbol => {
        if (configs.arbitrage.filter.only_listed_tickets) {
            //console.info("symbol", symbol);

            if (_find)
                configs.arbitrage.tickets.map(tn => {
                    var coins = symbol.split("/");
                    if (coins[0] === tn) {
                        configs.arbitrage.tickets.map(tn1 => {
                            if (coins[1] === tn1) {
                                console.log(symbol);
                                symbols.push(symbol);
                            }
                        });
                    }
                });
        } else {
            return configs.arbitrage.filter.tickets
                ? configs.arbitrage.tickets.map(tn =>
                      symbol.indexOf(tn) >= 0 ? symbols.push(symbol) : 0
                  )
                : symbols.push(symbol);
        }
    });

    let arbitrables = symbols
        .filter(
            symbol => exchanges.filter(name => api[name].symbols.indexOf(symbol) >= 0).length > 1
        )
        .sort((id1, id2) => (id1 > id2 ? 1 : id2 > id1 ? -1 : 0));

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

    console.info(
        "Exchanges:",
        colors.green(exchanges.length),
        "| Tickets:",
        colors.green(tickets.length)
    );
    return tickets;
}
