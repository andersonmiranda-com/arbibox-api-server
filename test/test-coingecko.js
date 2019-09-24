const CoinGecko = require("coingecko-api");
var moment = require("moment");
const util = require("util");

const CoinGeckoClient = new CoinGecko();

async function test(name, symbol) {
    //
    //
    //let data = await CoinGeckoClient.global();
    //let data = await CoinGeckoClient.coins.all();
    //let data = await CoinGeckoClient.coins.list();
    let data = await CoinGeckoClient.coins.markets();
    //let data = await CoinGeckoClient.coins.fetch("bitcoin", {});
    //
    //let data = await CoinGeckoClient.exchanges.all();
    //let data = await CoinGeckoClient.exchanges.list();
    //
    //let data = await CoinGeckoClient.exchanges.fetch("binance");
    //let data = await CoinGeckoClient.exchanges.fetchTickers("binance");
    //let data = await CoinGeckoClient.exchanges.fetchStatusUpdates("binance");
    //
    //let data = await CoinGeckoClient.statusUpdates.all();

    console.info(
        "\n",
        "account",
        util.inspect(data, {
            colors: true,
            depth: null
        })
    );
}

test();
