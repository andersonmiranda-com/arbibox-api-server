"use strict";

const ccxt = require("ccxt");
const colors = require("colors");

const configs = require("../config/settings");
///////////////

const fetchTickers = async exchange => {
    let tickers = {};

    try {
        var _exchange;

        if (configs.keys[exchange]) {
            _exchange = new ccxt[exchange]({
                apiKey: configs.keys[exchange].apiKey,
                secret: configs.keys[exchange].secret,
                timeout: configs.apiTimeout * 1000,
                enableRateLimit: true
            });
        } else {
            _exchange = new ccxt[exchange]({
                timeout: configs.apiTimeout * 1000,
                enableRateLimit: true
            });
        }

        tickers = await _exchange.fetchTickers();
    } catch (error) {
        console.error(colors.red("X >> Error fetchTickers on:"), exchange);
        console.error(colors.red("X >> Error:"), error.message);
        return tickers;
    } finally {
        return tickers;
    }
};

///////////////

const fetchOrderBook = (exchange, symbol) => {
    return new Promise(async (resolve, reject) => {
        var orderBook = {};
        try {
            var _exchange;

            if (configs.keys[exchange]) {
                _exchange = new ccxt[exchange]({
                    apiKey: configs.keys[exchange].apiKey,
                    secret: configs.keys[exchange].secret,
                    timeout: configs.apiTimeout * 1000,
                    enableRateLimit: true,
                    nonce: function() {
                        return this.milliseconds();
                    }
                });
            } else {
                _exchange = new ccxt[exchange]({
                    timeout: configs.apiTimeout * 1000,
                    enableRateLimit: true,
                    nonce: function() {
                        return this.milliseconds();
                    }
                });
            }

            let limit = 5;
            orderBook = await _exchange.fetchOrderBook(symbol, limit);
            orderBook.exchange = exchange;
            orderBook.symbol = symbol;
            resolve(orderBook);
        } catch (error) {
            console.error(colors.red("X >> Error fetchOrderBook:"), error.message);
            resolve(orderBook);
        }
    });
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
///
///

async function fetchTrades(exchange, symbol) {
    var exchangeInfo = {
        id: exchange,
        symbol: symbol,
        trades: [],
        wallets: []
    };

    try {
        var _exchange;

        if (configs.keys[exchange]) {
            _exchange = new ccxt[exchange]({
                apiKey: configs.keys[exchange].apiKey,
                secret: configs.keys[exchange].secret,
                timeout: configs.apiTimeout * 1000,
                enableRateLimit: true,
                nonce: function() {
                    return this.milliseconds();
                }
            });
            // exchangeInfo.wallets = await _exchange.fetchBalance();
            // db.saveWallets(exchangeTickets.id, {
            //     id: exchangeTickets.id,
            //     free: exchangeTickets.wallets.free,
            //     total: exchangeTickets.wallets.total
            // });
        } else {
            _exchange = new ccxt[exchange]({
                timeout: configs.apiTimeout * 1000,
                enableRateLimit: true,
                nonce: function() {
                    return this.milliseconds();
                }
            });
            exchangeInfo.wallets = [];
        }

        let since =
            _exchange.milliseconds() - configs.triangular.quality.lastTradeTimeLimit * 60 * 1000; //
        let limit = 1;
        exchangeInfo.trades = await _exchange.fetchTrades(symbol, since, limit);

        //tickets.map(ticket => verbose && console.log(ticket));
    } catch (error) {
        console.error(colors.red("Q >> Error fetchTrades:"), error.message);
        return exchangeInfo;
    } finally {
        return exchangeInfo;
    }
}

///////////////

const fetchBalance = async exchange => {
    var exchangeInfo = {
        id: exchange,
        wallets: []
    };

    try {
        var _exchange;

        if (configs.keys[exchange]) {
            _exchange = new ccxt[exchange]({
                apiKey: configs.keys[exchange].apiKey,
                secret: configs.keys[exchange].secret,
                timeout: configs.apiTimeout * 1000,
                enableRateLimit: true,
                nonce: function() {
                    return this.milliseconds();
                }
            });
            exchangeInfo.wallets = await _exchange.fetchBalance();
            //db.saveWallets(exchangeTickets.id, {
            //    id: exchangeTickets.id,
            //    free: exchangeTickets.wallets.free,
            //    total: exchangeTickets.wallets.total
            //});
        } else {
            exchangeInfo.wallets = [];
        }

        //tickets.map(ticket => verbose && console.log(ticket));
    } catch (error) {
        console.error(colors.red("E >> Error fetchBalance:"), error.message);
        return exchangeInfo;
    } finally {
        return exchangeInfo;
    }
};

module.exports = {
    fetchTickers,
    fetchTrades,
    fetchOrderBook,
    fetchBalance
};
