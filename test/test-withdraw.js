const ccxt = require("ccxt");
var moment = require("moment");
const axios = require("axios");
const util = require("util");
const https = require("https");

const { configs } = require("../core/arbitrage/settings");
const { apiKeys } = require("../core/arbitrage/settingsApiKeys");

async function test(source, destination, currency, amount) {
    var api = [];

    api[source] = await loadInstance(source);
    api[destination] = await loadInstance(destination);

    //

    /////////////////////////////////////////////////////////
    //
    // buy order data
    //

    let wdAddress = {};
    if (api[destination].has["fetchDepositAddress"]) {
        // fetching Address
        console.log("fetchDepositAddress");
        wdAddress = await api[destination].fetchDepositAddress(currency);
    } else if (api[destination].has["createDepositAddress"]) {
        // creating Address
        console.log("createDepositAddress");
        wdAddress = await api[destination].createDepositAddress(currency);
    } else {
        console.error(
            "Error:",
            destination,
            "does not have fetchDepositAddress or createDepositAddress"
        );
        return false;
    }

    console.info(
        "\n",
        util.inspect(wdAddress, {
            colors: true
        })
    );

    let wdData = {
        exchange: source,
        code: currency,
        amount: amount,
        address: wdAddress
    };

    let tag = wdAddress.tag || null;

    // make withdraw

    let withdraw = await api[source].withdraw(
        currency,
        amount,
        wdAddress.address,
        wdAddress.tag || undefined,
        (params = {})
    );

    console.info(
        "\n",
        util.inspect(withdraw, {
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

test("kucoin", "binance", "TRX", 4558);
//test("binance", "kucoin", "TRX", 4558);
