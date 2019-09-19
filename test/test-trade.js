const ccxt = require("ccxt");
var moment = require("moment");
const axios = require("axios");
const util = require("util");
const https = require("https");

const { configs } = require("../core/arbitrage/settings");
const { apiKeys } = require("../core/arbitrage/settingsApiKeys");

async function test(exchange, symbol, side, amount, type = "market", price) {
    var api = [];

    api[exchange] = await loadInstance(exchange);

    //

    /////////////////////////////////////////////////////////
    //
    // buy order data
    //

    orderData = {
        exchange: exchange,
        side: side,
        type: type,
        symbol: symbol,
        amount: amount,
        price: price || undefined
    };

    console.info(
        "\n",
        "orderData",
        util.inspect(orderData, {
            colors: true
        })
    );

    let orderResult = await api[exchange].createOrder(symbol, type, side, amount);

    console.info(
        "\n",
        "orderResult",
        util.inspect(orderResult, {
            colors: true
        })
    );
    // let buyWdAddress = {
    //     currency: opportunity.quote,
    //     address: "abc",
    //     tag: "tag",
    //     info: "info"
    // };

    // /////////////////////////////////////////////////////////
    // //
    // // buy order data
    // //

    // //let sellWdAddress = fetchDepositAddress(opportunity.sell_at, opportunity.base);
    // let sellWdAddress = {
    //     currency: opportunity.base,
    //     address: "def",
    //     tag: "tag",
    //     info: "info"
    // };

    // //withdrawal from buy side
    // let buyWdData = {
    //     exchange: opportunity.buy_at,
    //     code: opportunity.base,
    //     amount: buyWdAmount,
    //     address: sellWdAddress
    // };

    // //withdrawal from buy side
    // let sellWdData = {
    //     exchange: opportunity.sell_at,
    //     code: opportunity.quote,
    //     amount: sellWdAmount,
    //     address: buyWdAddress
    // };

    //console.log(colors.green("E >> Executing..."), order);
}

async function loadInstance(name) {
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
            enableRateLimit: true,
            verbose: true
        });
    }

    await _instance.loadMarkets();

    return _instance;
}

test("kucoin", "ETH/BTC", "buy", 0.5, "market");
//test("binance", "kucoin", "TRX", 4558);
