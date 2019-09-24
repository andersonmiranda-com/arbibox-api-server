const ccxt = require("ccxt");
var moment = require("moment");
const axios = require("axios");
const util = require("util");
const https = require("https");

const { configs } = require("../core/arbitrage/settings");
const { apiKeys } = require("../core/arbitrage/settingsApiKeys");

async function test(name, symbol) {
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

    let response = await _instance.fetchTicker(symbol);
    //et response = await _instance.markets;
    // let endtickers = chain.map(symbol => exc_tickers[symbol]);

    console.info(
        "\n",
        util.inspect(response, {
            colors: true,
            depth: null
        })
    );
}

<<<<<<< HEAD
test("hitbtc2", "BTM/USDT");
=======
test("binance", "THETA/BTC");
>>>>>>> backend
