"use strict";

const ccxt = require("ccxt");

const quality = require("./core/arbitrage/quality");
const configs = require("./config/settings-arbitrage");

let signal = {
    _id: "5d788eab30f42fabffee3be9",
    id: "gto/btc-binance-bittrex",
    base: "GTO",
    bestAsk: {
        bid: 1.22e-6,
        ask: 1.23e-6,
        baseVolume: 13359659,
        quoteVolume: 16.39681784,
        name: "binance",
        symbol: "GTO/BTC",
        tradeFee: 0.001,
        minAmount: 1,
        baseWithdrawalFee: 2.2
    },
    bestBid: {
        bid: 1.8e-6,
        ask: 1.88e-6,
        baseVolume: 175512.4716422,
        quoteVolume: 0.317089,
        name: "bittrex",
        symbol: "GTO/BTC",
        tradeFee: 0.0025,
        minAmount: 145.34883721,
        quoteWithdrawalFee: 0.0005
    },
    buy_at: "binance",
    invest: {},
    lastest: [
        {
            signal_created_at: new Date("2019-09-11T06:05:31.070Z"),
            profit_percent: 45.8756
        }
    ],
    profit_loop_percent: 45.3257,
    profit_percent: 45.8756,
    quote: "BTC",
    sell_at: "bittrex",
    signal_created_at: new Date("2019-09-11T06:05:31.070Z"),
    symbol: "GTO/BTC",
    type: "PA"
};

const testQuality = async signal => {
    global.api = {};
    var _instance;

    let name = signal.buy_at;

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

    api[name] = _instance;

    name = signal.sell_at;

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

    api[name] = _instance;

    quality.checkSignal(signal);
};

(async function() {
    console.log("");
    console.log("======================");
    console.log("Arbibox Quality test");
    console.log("======================");

    testQuality(signal);
})();
