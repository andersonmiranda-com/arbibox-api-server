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

    //console.log(_instance.markets);

    // console.info(
    //     "\n",
    //     util.inspect(_instance.markets, {
    //         colors: true
    //     })
    // );

    //console.log(await _instance.loadMarkets());
    //let markets = await _instance.fetchCurrencies();

    //    Object.keys(markets).forEach(function(key) {
    //console.log(markets);
    //  });

    // var start0 = new Date();
    // console.info("Start 0", start0);

    let response = await _instance.fetchBalance();
    // let endtickers = chain.map(symbol => exc_tickers[symbol]);

    console.info(
        "\n",
        util.inspect(response.free, {
            colors: true,
            depth: null
        })
    );

    response = await _instance.fetchBalance({ type: "main" });
    // let endtickers = chain.map(symbol => exc_tickers[symbol]);

    console.info(
        "\n",
        "account",
        util.inspect(response.free, {
            colors: true,
            depth: null
        })
    );
}
//arbitrage.checkOpportunity(response);

//console.log(weightedMean([100, 102, 104], [5, 20, 10]));

//test("kraken", "ETH/BTC");
//test("zb", ["XEM/BTC", "XEM/USDT", "BTC/USDT"]);
test("kucoin", "TRX/BTC");
//test("livecoin", "XRP/ETH");
