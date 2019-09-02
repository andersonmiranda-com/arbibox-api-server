"use strict";

const colors = require("colors");

const configs = require("../config/settings-triangular");
///////////////

const fetchTickers = async exchange => {
    let tickers = {};

    try {
        tickers = await api[exchange].fetchTickers();
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
            let limit = 5;
            orderBook = await api[exchange].fetchOrderBook(symbol, limit);
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

    //var start1 = new Date();

    try {
        let since = api[exchange].milliseconds() - configs.quality.lastTradeTimeLimit * 60 * 1000; //
        let limit = 1;
        exchangeInfo.trades = await api[exchange].fetchTrades(symbol, since, limit);

        //   var end1 = new Date() - start1;
        //   console.info("Execution fetchTrades: %dms", end1, exchange, symbol);

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
        if (configs.keys[exchange]) {
            exchangeInfo.wallets = await api[exchange].fetchBalance();
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
