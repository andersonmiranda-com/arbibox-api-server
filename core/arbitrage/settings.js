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
        "ethfinex"
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

    keys: {
        binance: {
            apiKey: "JtTwtetprHSvnk6FHR1Die4JOeguNxHmbsDr4Rm1UCXeZ8kQVC4YmnRMFa9h3h0L",
            secret: "1YwE3eThkxkq8Y4DlbiQG8tWITwsWbKYdWTQF3z1dnUO3vSVirXm3TxdLW0vtUrN"
        },
        livecoin: {
            apiKey: "Ck5n1GAyjwfdV6eK7KgWpkfKyvKQw3SW",
            secret: "mQ1Ws8WVAQg9sXsu7UzaEB4MgUvmkvEm"
        },
        bibox: {
            apiKey: "4fd164f9c755a39b6ac35e47f2c9507a0deafd88",
            secret: "2a308fe5e96918f748db68d2ae0b6acc31adff47"
        },
        kraken: {
            apiKey: "ZGnU5nmc4/Y+FGYpkwXpaGhYphohkUKkU37Gd3zr6w1XbMuMCJZKQ1RK",
            secret:
                "csjYywPe8c51zBvDrYV96iiZVwokozSpmCP+pdOGOzWQ1FwStEpRZnIEhujxx9Hxb2XK7oipi5k7ZU/jrCKdPw=="
        },
        hitbtc: {
            apiKey: "0P+2ik5JXiB4kjbnuQtU/cw0oIlXmHf9",
            secret: "d2wzFWYM0dm437YxZZ6TiCK+E3NLmGFO"
        },
        bitfinex: {
            apiKey: "gfuxiWVe33k0dX46Ug3XiOy3U6z6r9KUgoOYhQCh0gM",
            secret: "zcBrFykqhh6RwUFNlcQRoaATm6nbEh3NLvh1zaXAWx3"
        },
        cointiger: {
            apiKey: "ca3b1ccc-fb62-4c38-bb4a-052fd0989de0",
            secret:
                "Yzc1ZjM4MWQzMjk4NjRlOWM5ZjkxY2ViNTRmMGQxNDM3YjJkOTI0MDgwODI0Y2FlNjFjODNiNzE4NDEwNTRiMA=="
        }
    },

    //calculate and execute parallel arbitrage with withdraw on every trade operecion
    loopWithdraw: false,

    //execute loop withdraw only when balance is insuficient
    autoWithdraw: true,

    //searh parameters
    search: {
        checkInterval: 10,
        minimumProfit: 0.05,
        minimumProfitInvest: 0.05,

        // quote currencies referneces to calculate profit in parallel loop (used when loopWithdraw is true)
        quoteCurrencyFunds: {
            BTC: 0.1,
            USD: 1000,
            USDT: 1000,
            ETH: 5
        }
    },

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
        checkInterval: 10
    }
};

module.exports = {
    configs
};
