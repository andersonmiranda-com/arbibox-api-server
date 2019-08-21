const ccxt = require("ccxt");

async function test() {
    let name = "zb";

    _instance = new ccxt[name]({
        timeout: 10000,
        enableRateLimit: true
    });

    let markets = await _instance.fetchMarkets();

    console.log(markets);
}

test();
