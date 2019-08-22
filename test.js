const ccxt = require("ccxt");
const configs = require("./config/settings");
var moment = require("moment");

async function test(name, chain) {
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

    var start0 = new Date();
    console.info("Start 0", start0);

    let exc_tickers = await _instance.fetchTickers();
    let endtickers = chain.map(symbol => exc_tickers[symbol]);
    console.log("\nEndtickers", endtickers);

    var end0 = new Date() - start0;
    console.info("Execution time0: %dms", end0);

    ///

    // var start1 = new Date();
    // console.info("Start 1", start1);

    // _instance.fetchTickers().then(exc_tickers => {
    //     let endtickers = chain.map(symbol => exc_tickers[symbol]);
    //     console.log("\nEndtickers", endtickers);

    //     var end1 = new Date() - start1;
    //     console.info("Execution time1: %dms", end1);
    // });

    //
    //var start2 = new Date();
    //let promises = tickers.map(async symbol =>
    //    Promise.resolve(await _instance.fetchTicker(symbol))
    //);
    //Promise.all(promises).then(
    //    response => {
    //        console.log("\nTickers response", response);
    //        var end2 = new Date() - start2;
    //        console.info("Execution time2: %dms", end2);
    //    }
    //
    //    //arbitrage.checkOpportunity(response);
    //);
    //

    var start3 = new Date();
    console.info("Start 3", start3);

    let since =
        _instance.milliseconds() - configs.triangular.quality.lastTradeTimeLimit * 60 * 1000; //
    let limit = 1;
    let promises2 = chain.map(async symbol =>
        Promise.resolve(await _instance.fetchTrades(symbol, since, limit))
    );
    Promise.all(promises2).then(
        response => {
            console.log("\nTrades", response);
            var end3 = new Date() - start3;
            console.info("Execution time3: %dms", end3);
        }

        //arbitrage.checkOpportunity(response);
    );
}

//test("zb", ["XEM/BTC", "XEM/USDT", "BTC/USDT"]);
test("kucoin", ["ETH/USDT", "ETC/USDT", "ETC/ETH"]);
