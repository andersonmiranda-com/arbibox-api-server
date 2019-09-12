const configs = {
    apiTimeout: 20,
    exchanges: [
        "bittrex",
        "bitfinex",
        "poloniex",
        "binance",
        "ethfinex",
        "bibox",
        "kucoin",
        "gateio",
        "livecoin",
        "exmo"
    ],
    exchangesBlacklist: ["coinmarketcap", "dx", "crex24"],
    baseCurrencies: [
        "BTC",
        "ETH",
        "XRP",
        "BCH",
        "LTC",
        "BNB",
        "PAX",
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
        "ETC",
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
        "VET"
    ],

    currenciesBlacklist: ["VIA"],

    keys: {
        bibox: {
            apiKey: "4fd164f9c755a39b6ac35e47f2c9507a0deafd88",
            secret: "2a308fe5e96918f748db68d2ae0b6acc31adff47"
        },
        binance: {
            apiKey: "JtTwtetprHSvnk6FHR1Die4JOeguNxHmbsDr4Rm1UCXeZ8kQVC4YmnRMFa9h3h0L",
            secret: "1YwE3eThkxkq8Y4DlbiQG8tWITwsWbKYdWTQF3z1dnUO3vSVirXm3TxdLW0vtUrN"
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

    marketFilter: {
        exchanges: true,
        exchangesBlacklist: true,
        baseCurrencies: true,
        quoteCurrencies: true
    },
    search: {
        checkInterval: 5,
        minimumProfit: 0.1,
        targetAssets: ["BTC", "ETH", "USDT", "BNB", "PAX"]
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
        removeAfterMinutesOff: 1,
        removeAfterIterations: 5
    },
    execution: {
        checkInterval: 6
    }
};

module.exports = {
    configs
};
