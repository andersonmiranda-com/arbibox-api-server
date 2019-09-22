const configs = {
    apiTimeout: 20,
    //
    exchanges: [
        "binance",
        "hitbtc2",
        "kraken",
        //"bibox",
        "bitfinex",
        //"cointiger",
        "livecoin",
        "kucoin",
        "poloniex",
        //"bigone",
        //"upbit",
        "gateio",
        "exmo",
        "bittrex",
        //"tidebit",
        "ethfinex"
        //"zb",
        //"okex"
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
        currenciesBlacklist: false,
        //get top CMC currencies
        baseCurrenciesCMC: false,
        //number of top CMC currencies to load
        baseCurrenciesCMCQty: 30,
        //limit base currencies to the list (disabled if baseCurrenciesCMC id true)
        baseCurrenciesFromList: false,
        //limit quote currencies to the list
        quoteCurrencies: false
    },

    //searh parameters
    search: {
        checkInterval: 60, //seconds
        cleanUpInterval: 60, //seconds

        minimumProfit: 0.1,
        minimumProfitInvest: 0.1,

        // quote currencies referneces to calculate profit in parallel loop (used when loopWithdraw is true)
        quoteCurrencyFunds: {
            BTC: 0.1,
            USD: 1000,
            USDT: 1000,
            ETH: 5
        },

        // Send to qualifier a new signal one time every time block / remove signals older than time block (minutes)
        signalTimeBlock: 1
    },

    //calculate and execute parallel arbitrage with withdraw on every trade operecion
    loopWithdraw: false,

    //execute loop withdraw only when balance is insuficient
    autoWithdraw: true,

    quality: {
        filter: {
            //check 24hVolume on tickers
            tickerVolume: false,
            tickerLowVolumeLimit: {
                quote: {
                    BTC: 1,
                    ETH: 50,
                    USD: 10000,
                    USDT: 10000,
                    EUR: 10000,
                    EUR: 600000,
                    CAD: 10000,
                    BNB: 500
                }
            },

            //check trade history activity
            tradeActivity: false
        },

        // time to check las trade transaction (in minutes)
        lastTradeTimeLimit: 10,

        // Saves lost opportunity to table every time block (minutes)
        lostOpportunitiesTimeBlock: 5
    },

    execution: {
        simulationMode: true,
        checkInterval: 120
    }
};

module.exports = {
    configs
};
