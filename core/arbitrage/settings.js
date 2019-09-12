const configs = {
    apiTimeout: 20,
    exchanges: [
        "bibox",
        "binance",
        "zb",
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

    quoteCurrencies: ["BTC", "ETH", "USDT", "BNB", "PAX", "USDC", "TUSD"],

    currenciesBlacklist: ["ETC"],

    marketFilter: {
        exchanges: true,
        exchangesBlacklist: true,
        currenciesBlacklist: true,
        baseCurrenciesCMC: true,
        baseCurrenciesCMCQty: 100,
        baseCurrenciesFromList: true,
        quoteCurrencies: true
    },

    keys: {
        bibox: {
            apiKey: "4fd164f9c755a39b6ac35e47f2c9507a0deafd88",
            secret: "2a308fe5e96918f748db68d2ae0b6acc31adff47"
        },
        binance: {
            apiKey: "JtTwtetprHSvnk6FHR1Die4JOeguNxHmbsDr4Rm1UCXeZ8kQVC4YmnRMFa9h3h0L",
            secret: "1YwE3eThkxkq8Y4DlbiQG8tWITwsWbKYdWTQF3z1dnUO3vSVirXm3TxdLW0vtUrN"
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

    loopWithdraw: false,
    autoWithdraw: true,

    search: {
        checkInterval: 10,
        minimumProfit: 0.1,
        minimumProfitInvest: 0.1,
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
            tradeActivity: false,
            orderBookVolume: true,
            tickerVolume: true,
            tickerLowVolumeLimit: {
                base: 0.01,
                quote: {
                    BTC: 0.1,
                    USD: 1000,
                    USDT: 1000,
                    ETH: 5
                }
            }
        },
        lastTradeTimeLimit: 10,
        removeAfterMinutesOff: 2,
        removeAfterIterations: 10
    },

    execution: {
        simulationMode: true,
        checkInterval: 10
    }
};

module.exports = {
    configs
};
