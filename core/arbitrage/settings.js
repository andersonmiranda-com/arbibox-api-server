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

    //default base currencies
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
    //quoteCurrencies: ["USD"],

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
        baseCurrenciesCMCQty: 50,
        //limit base currencies to the list (disabled if baseCurrenciesCMC id true)
        baseCurrenciesFromList: false,
        //limit quote currencies to the list
        quoteCurrencies: false
    },

    //searh parameters
    search: {
        checkInterval: 60, //seconds
        cleanUpInterval: 60, //seconds

        minimumProfit: 0,
        minimumProfitInvest: 0.1,

        // quote currencies referneces to calculate profit in parallel loop (used when loopWithdraw is true)
        quoteCurrencyFunds: {
            BTC: 0.1,
            USD: 1000,
            USDT: 1000,
            ETH: 5
        },

        filter: {
            //check 24hVolume on tickers
            tickerVolume: false,
            tickerLowVolumeLimit: {
                // equivalent aprox to 1 BTC of minimun volume in 24h
                quote: {
                    BTC: 1,
                    ETH: 50,
                    USD: 10000,
                    USDT: 10000,
                    USDS: 10000,
                    TUSD: 10000,
                    USDC: 10000,
                    BUSD: 10000,
                    EUR: 10000,
                    CAD: 10000,
                    BNB: 500,
                    PAX: 10000,
                    TRX: 600000,
                    XRP: 40000
                }
            }
        },

        // Saves a new signal one time every time block / remove signals older than time block (minutes)
        signalTimeBlock: 1,

        //calculate and execute parallel arbitrage with withdraw on every trade operecion
        loopWithdraw: false,

        //execute loop withdraw only when balance is insuficient
        autoWithdraw: true,

        // Saves lost opportunity to table every time block (minutes)
        lostOpportunitiesTimeBlock: 5
    },

    quality: {
        //check trade history activity
        tradeActivity: false,
        // time to check las trade transaction (in minutes)
        lastTradeTimeLimit: 10
    },

    execution: {
        //does not create orders
        simulationMode: true,

        //intervel to check orders statis on exchanges
        checkInterval: 120
    }
};

module.exports = {
    configs
};
