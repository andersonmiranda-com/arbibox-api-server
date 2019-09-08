"use strict";

const colors = require("colors");

const configs = require("../config/settings-arbitrage");
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

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// Orders
///

const createOrder = async ({ exchange, side, type, symbol, amount, price }) => {
    let orderResult = {};
    return new Promise(async (resolve, reject) => {
        try {
            if (type === "market" && api[exchange].has["createMarketOrder"]) {
                orderResult = await api[exchange].createOrder(symbol, type, side, amount);
            } else {
                type = type === "market" ? "limit" : type;
                orderResult = await api[exchange].createOrder(symbol, type, side, amount, price);
            }
            resolve(orderResult);
        } catch (error) {
            console.error(colors.red("X >> Error createOrder:"), error.message);
            resolve(orderResult);
        }
    });
};

///////////////

const fetchBalance = async exchange => {
    let total = {};

    try {
        if (configs.keys[exchange]) {
            let balance = await api[exchange].fetchBalance();
            total = balance.total;
            //db.saveWallets(exchangeTickets.id, {
            //    id: exchangeTickets.id,
            //    free: exchangeTickets.wallets.free,
            //    total: exchangeTickets.wallets.total
            //});
        }
        //tickets.map(ticket => verbose && console.log(ticket));
    } catch (error) {
        console.error(colors.red("E >> Error fetchBalance:"), error.message);
        return total;
    } finally {
        return total;
    }
};

module.exports = {
    fetchTickers,
    fetchTrades,
    createOrder,
    fetchOrderBook,
    fetchBalance
};
