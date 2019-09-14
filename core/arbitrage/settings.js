const configs = {
    apiTimeout: 20,
    //
    exchanges: [
        "bibox",
        "binance",
        "bigone",
        "kucoin",
        "kraken",
        "upbit",
        "bitfinex",
        "gateio",
        "exmo",
        "livecoin",
        "bittrex",
        "poloniex",
        "tidebit",
        "ethfinex",
        "hitbtc2"
        //        "zb",
    ],

    exchangesBlacklist: ["coinmarketcap", "dx", "crex24"],

    baseCurrencies: [
        "BTC",
        "ETH",
        "XRP",
        "BCH",
        "LTC",
        "BNB",
        "USDT",
        "EOS",
        "BSV",
        "XMR",
        "XLM",
        "LEO",
        "ADA",
        "TRX",
        "LINK",
        "DASH",
        "XTZ",
        "NEO",
        "MIOTA",
        "ATOM",
        "XEM",
        "MKR",
        "ONT",
        "CRO",
        "USDC",
        "ZEC",
        "VSYS",
        "DOGE",
        "DCR",
        "VET",
        "ENJ"
    ],

    //quoteCurrencies: ["BTC", "ETH", "USDT", "BNB", "PAX", "USDC", "TUSD"],
    quoteCurrencies: ["BTC", "ETH", "USDT"],

    currenciesBlacklist: ["ETC", "MKR"],

    marketFilter: {
        //limit exchanges to the list
        exchanges: true,
        //filter exchanges against blacklist
        exchangesBlacklist: true,
        //filter currencies against blacklist
        currenciesBlacklist: true,
        //get top CMC currencies
        baseCurrenciesCMC: true,
        //number of top CMC currencies to load
        baseCurrenciesCMCQty: 50,
        //limit base currencies to the list (disabled if baseCurrenciesCMC id true)
        baseCurrenciesFromList: true,
        //limit quote currencies to the list
        quoteCurrencies: true
    },

    //searh parameters
    search: {
        checkInterval: 10,
        minimumProfit: 0.1,
        minimumProfitInvest: 0.1,

        // quote currencies referneces to calculate profit in parallel loop (used when loopWithdraw is true)
        quoteCurrencyFunds: {
            BTC: 0.1,
            USD: 1000,
            USDT: 1000,
            ETH: 5
        }
    },

    //calculate and execute parallel arbitrage with withdraw on every trade operecion
    loopWithdraw: false,

    //execute loop withdraw only when balance is insuficient
    autoWithdraw: true,

    quality: {
        checkInterval: 30,
        filter: {
            //check 24hVolume on tickers
            tickerVolume: true,
            tickerLowVolumeLimit: {
                base: 0.01,
                quote: {
                    BTC: 0.1,
                    USD: 1000,
                    USDT: 1000,
                    ETH: 5
                }
            },

            //check trade history activity
            tradeActivity: false
        },

        // time to check las trade transaction (in minutes)
        lastTradeTimeLimit: 10,

        // Remove a inactive signal from list after minutes
        removeAfterMinutesOff: 2,

        // Remove a reproved signal from list after minutes
        removeAfterIterations: 6
    },

    execution: {
        simulationMode: false,
        checkInterval: 120
    }
};

module.exports = {
    configs
};