const ccxt = require("ccxt");
var moment = require("moment");
const axios = require("axios");
const util = require("util");

const configs = require("./config/settings-arbitrage");

async function test(name, symbol) {
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

    await _instance.loadMarkets();

    //console.log(_instance);
    //console.log(await _instance.loadMarkets());
    //let markets = await _instance.fetchMarkets();
    //console.log(markets);

    // var start0 = new Date();
    // console.info("Start 0", start0);

    // let exc_tickers = await _instance.fetchTickers();
    // let endtickers = chain.map(symbol => exc_tickers[symbol]);
    // //console.log("\nEndtickers", endtickers);
    // console.log("0", endtickers[0].ask);
    // console.log("0", endtickers[0].bid);
    // console.log("1", endtickers[1].ask);
    // console.log("1", endtickers[1].bid);
    // console.log("2", endtickers[2].ask);
    // console.log("2", endtickers[2].bid);

    // var end0 = new Date() - start0;
    // console.info("Execution time0: %dms", end0);

    ///

    //var start0 = new Date();
    //console.info("Start 0", start0);

    // axios
    //     .get("https://api.binance.com/api/v3/ticker/bookTicker")
    //     .then(function(response) {
    //         // handle success
    //         console.log(response.data.length);
    //         var end0 = new Date() - start0;
    //         console.info("Execution time0: %dms", end0);
    //     })
    //     .catch(function(error) {
    //         // handle error
    //         console.log(error);
    //     })
    //     .finally(function() {
    //         // always executed
    //     });

    /*     var start1 = new Date();
    console.info("Start 1", start1);

    axios
        .get("http://localhost:3000/exchange/" + name + "/markets")
        .then(function(response) {
            // handle success
            console.log(response.data.length);
            console.log(response.data);
            var end1 = new Date() - start1;
            console.info("Execution time1: %dms", end1);
        })
        .catch(function(error) {
            // handle error
            console.log(error);
        })
        .finally(function() {
            // always executed
        }); */

    // var start1a = new Date();
    // //console.info("Start 1a", start1a);

    // //let response = await _instance.fetchDepositAddress("USD");
    // let response = await _instance.fetchBalance();

    // //console.log(name, "ETC", response.total["ETC"], "ETH", response.total["ETH"]);
    // //let endtickers = chain.map(symbol => exc_tickers[symbol]);
    // console.log("response", response);

    // // console.info(
    // //     "\n",
    // //     util.inspect(response, {
    // //         colors: false,
    // //         depth: null
    // //     })
    // // );

    // var end1a = new Date() - start1a;
    //console.info("Execution time1a: %dms", end1a);

    /*
    
    var start2 = new Date();
    console.info("Start 2", start2);
    
    let tickers = await _instance.fetchTickers();
    console.log("\tickers", tickers);
    
    var end2 = new Date() - start2;
    console.info("Execution time2: %dms", end2);
    
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

    // var start3 = new Date();
    // console.info("Start 3", start3);

    // let since =
    //     _instance.milliseconds() - configs.triangular.quality.lastTradeTimeLimit * 60 * 1000; //
    // let limit = 1;
    // let promises2 = chain.map(async symbol =>
    //     Promise.resolve(await _instance.fetchTrades(symbol, since, limit))
    // );
    // Promise.all(promises2).then(
    //     response => {
    //         console.log("\nTrades", response);
    //         var end3 = new Date() - start3;
    //         console.info("Execution time3: %dms", end3);
    //     }

    //     //arbitrage.checkOpportunity(response);
    // );

    */
    var start3 = new Date();
    console.info("Start 3", start3);
    let limit = 5;
    let response = await _instance.fetchOrderBook(symbol, limit);

    console.log(name);
    console.log("asks");
    weightedMeanOrderBook(response.asks, 1);
    weightedMeanOrderBook(response.asks, 2);
    weightedMeanOrderBook(response.asks, 3);
    weightedMeanOrderBook(response.asks, 5);

    console.log("bids");
    weightedMeanOrderBook(response.bids, 1);
    weightedMeanOrderBook(response.bids, 2);
    weightedMeanOrderBook(response.bids, 3);
    weightedMeanOrderBook(response.bids, 5);

    // console.log("\n", chain[0]);
    // console.log("ask1", response[0].asks[0]);
    // console.log("bid1", response[0].bids[0]);

    // console.log("ask2", response[0].asks[1]);
    // console.log("bid2", response[0].bids[1]);

    // console.log("\n", chain[1]);
    // console.log("ask1", response[1].asks[0]);
    // console.log("bid1", response[1].bids[0]);

    // console.log("ask2", response[1].asks[1]);
    // console.log("bid2", response[1].bids[1]);

    // console.log("\n", chain[2]);
    // console.log("ask1", response[2].asks[0]);
    // console.log("bid1", response[2].bids[0]);

    // console.log("ask2", response[2].asks[1]);
    // console.log("bid2", response[2].bids[1]);
    var end3 = new Date() - start3;

    console.info("Execution time3: %dms", end3);
}
//arbitrage.checkOpportunity(response);

function weightedMeanOrderBook(orderBook, elements) {
    let values = [];
    let volume = [];
    let sumVolume = 0;

    let initArray = orderBook.slice(0, elements);

    initArray.forEach(line => {
        values.push(line[0]);
        volume.push(line[1]);
        sumVolume = sumVolume + line[1];
    });

    //console.log(values, volume);
    console.log(weightedMean(values, volume), sumVolume);
}

function weightedMean(arrValues, arrWeights) {
    var result = arrValues
        .map(function(value, i) {
            var weight = arrWeights[i];
            var sum = value * weight;

            return [sum, weight];
        })
        .reduce(
            function(p, c) {
                return [p[0] + c[0], p[1] + c[1]];
            },
            [0, 0]
        );

    return result[0] / result[1];
}

//console.log(weightedMean([100, 102, 104], [5, 20, 10]));

//test("kraken", "ETH/BTC");
//test("zb", ["XEM/BTC", "XEM/USDT", "BTC/USDT"]);
test("kucoin", "XRP/ETH");
test("livecoin", "XRP/ETH");
