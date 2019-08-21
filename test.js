const ccxt = require("ccxt");
const configs = require("./config/settings");

async function test(name) {
    var _instance;

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

    //console.log(_instance);
    //console.log(await _instance.loadMarkets());
    //let markets = await _instance.fetchMarkets();
    //console.log(markets);
    let tickers = await _instance.fetchTickers();
    console.log(tickers);
}

test("cointiger");
