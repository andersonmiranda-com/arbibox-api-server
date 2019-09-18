const ccxt = require("ccxt");
const moment = require("moment");
const lodash = require("lodash");
const util = require("util");

const { configs } = require("./settings");
const colors = require("colors");

const { createOrder, fetchBalance, fetchTickers } = require("../exchange");
const db = require("../db");

//global.exchanges;

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// check Wallet
///

async function getWallets() {
    // get Wallets Balances

    let wallets = [];

    exchanges.map(async exchange => await getWallet(exchange));
    //let promises = ["binance"].map(exchange => Promise.resolve(getWallet(exchange)));
}

async function getWallet(exchange) {
    console.log("exchange:", exchange);
    let tempWallets = await fetchBalance(exchange);
    let tickets = await fetchTickers(exchange);

    let free = pickNotZeroValues(tempWallets.free);
    let total = pickNotZeroValues(tempWallets.total);

    let wallet = {
        id: exchange,
        free: free,
        total: total,
        free_BTC: calcInBTC(free, tickets, "BTC"),
        total_BTC: calcInBTC(total, tickets, "BTC")
    };

    db.saveWallet(wallet);

    return wallet;
}

function calcInBTC(currencies, tickets, quoteCurrency) {
    let total = 0;
    Object.keys(currencies).forEach(function(key) {
        let amount = currencies[key];

        if (key === quoteCurrency) {
            total += amount;
        } else {
            Object.keys(tickets).forEach(function(key1) {
                let symbol = tickets[key1];
                let coins = symbol.symbol.split("/");
                if (coins[0] === key && coins[1] === quoteCurrency) {
                    // side = sell . Ex: ETH/BTC
                    // value in BTC = ETH * ask
                    total += amount * (symbol.ask || symbol.info.ask || symbol.info.askPrice);
                } else if (coins[0] === quoteCurrency && coins[1] === key) {
                    // side = sell . Ex: BTC/USDT
                    // value in BTC = USDT / bid
                    total += amount / (symbol.bid || symbol.info.bid || symbol.info.bidPrice);
                }
            });
        }
    });

    return total;
}

function pickNotZeroValues(values) {
    return lodash.pickBy(values, function(value, key) {
        return !!value;
    });
}

module.exports = {
    getWallets
};
