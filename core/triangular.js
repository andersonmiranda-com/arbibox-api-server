const ccxt = require("ccxt");
const lodash = require("lodash");
const configs = require("../config/settings");

const verbose = true;

async function findChains(targetAsset, markets) {
    const symbols = symbolFinder(targetAsset, markets);

    return symbols.then(async function({ sourceSymbols, compatibleSymbols }) {
        let chains = [];

        for (let firstSymbol of sourceSymbols) {
            for (let secondSymbol of compatibleSymbols) {
                for (let thirdSymbol of sourceSymbols) {
                    if (!matchSymbol(targetAsset, firstSymbol, secondSymbol, thirdSymbol)) {
                        continue;
                    }
                    let chain = new Chain(targetAsset, [firstSymbol, secondSymbol, thirdSymbol]);
                    // let chain = createChain(exchange, targetAsset, firstSymbol, secondSymbol, thirdSymbol);
                    chains.push(chain);
                    // console.log(`${chain}`);
                }
            }
        }

        return chains;
    });
}

function symbolFinder(targetAsset, markets) {
    verbose && console.log("There are " + markets.length + " total symbols on this exchange.");
    verbose && console.log("Looking for all " + targetAsset + " symbols:");
    let sourceSymbols = [];
    let otherAssetIds = [];
    for (let symbol of markets) {
        //console.log(symbol);

        if (
            symbol.symbol.indexOf("/") !== -1 &&
            (symbol.base == targetAsset || symbol.quote == targetAsset)
        ) {
            sourceSymbols.push(symbol);
            // console.log(symbol.base, symbol.quote);
            // Add the symbol id to a list if it not already on it, prevent the targetAsset symbol to be added
            if (otherAssetIds.indexOf(symbol.base) == -1 && symbol.base != targetAsset) {
                otherAssetIds.push(symbol.base);
            }
            if (otherAssetIds.indexOf(symbol.quote) == -1 && symbol.quote != targetAsset) {
                otherAssetIds.push(symbol.quote);
            }
        }
    }
    verbose && console.log("\t" + sourceSymbols.map(s => "- " + s.symbol).join("\n\t"));
    verbose &&
        console.log(
            "\tFound " + otherAssetIds.length + " other assets compatible with " + targetAsset + "."
        );
    verbose && console.log();

    verbose &&
        console.log(
            "Looking for all compatible " + targetAsset + " symbols to calculate arbitrage:"
        );
    let compatibleSymbols = [];
    for (let symbol of markets) {
        if (otherAssetIds.indexOf(symbol.base) != -1 && otherAssetIds.indexOf(symbol.quote) != -1) {
            compatibleSymbols.push(symbol);
        }
    }
    verbose &&
        console.log(
            "\tFound " +
                compatibleSymbols.length +
                " symbols to calculate arbitrage for " +
                targetAsset +
                "."
        );
    verbose && console.log("\t" + compatibleSymbols.map(s => "- " + s.symbol).join("\n\t"));

    return { sourceSymbols, compatibleSymbols };
}

async function prepareTickets() {
    let api = {};
    let exchanges = [];

    if (configs.filter.exchanges) {
        exchanges = configs.exchanges;
    } else {
        exchanges = ccxt.exchanges;
    }

    if (configs.filter.exchanges_blacklist) {
        exchanges = lodash.difference(exchanges, configs.exchanges_blacklist);
    }

    let checkedExchanges = [...exchanges];

    for (let i = 0; i < exchanges.length; i++) {
        let name = exchanges[i];
        console.log("Loading markets for", colors.green(name));
        try {
            var _instance;

            if (configs.keys[name]) {
                _instance = new ccxt[name]({
                    apiKey: configs.keys[name].apiKey,
                    secret: configs.keys[name].secret,
                    timeout: configs.api_timeout * 1000,
                    enableRateLimit: true
                });
            } else {
                _instance = new ccxt[name]({
                    timeout: configs.api_timeout * 1000,
                    enableRateLimit: true
                });
            }

            await _instance.loadMarkets();
            if (_instance.has["fetchTickers"]) {
                api[name] = _instance;
                //db.saveExchange(name, { symbols: _instance.symbols, markets: _instance.markets });
            } else {
                console.error(colors.red("Error: Exchange has no fetchTickers:"), name);
                checkedExchanges.splice(checkedExchanges.indexOf(name), 1);
            }
        } catch (error) {
            console.error(colors.red("Error:"), error.message);
            console.error(colors.red("Error initiating:"), name);
            checkedExchanges.splice(checkedExchanges.indexOf(name), 1);
        }
    }

    exchanges = [...checkedExchanges];

    let symbols0 = [];
    let symbols = [];
    ccxt.unique(
        ccxt.flatten(
            exchanges.map(name => {
                if (!api[name]) console.log(name);
                return api[name] ? api[name].symbols : [];
            })
        )
    ).filter(symbol => {
        var coins = symbol.split("/");
        var is_base = false;
        var is_quote = false;

        is_base = lodash.includes(configs.base_currencies, coins[0]);
        is_quote = lodash.includes(configs.quote_currencies, coins[1]);

        if (configs.filter.base_currencies && configs.filter.quote_currencies) {
            if (is_base && is_quote) {
                symbols.push(symbol);
            }
        } else if (configs.filter.base_currencies) {
            if (is_base) {
                symbols.push(symbol);
            }
        } else if (configs.filter.quote_currencies) {
            if (is_quote) {
                symbols.push(symbol);
            }
        } else {
            symbols.push(symbol);
        }
    });

    let arbitrables = symbols
        .filter(
            symbol => exchanges.filter(name => api[name].symbols.indexOf(symbol) >= 0).length > 1
        )
        .sort((id1, id2) => (id1 > id2 ? 1 : id2 > id1 ? -1 : 0));

    //console.log(symbols);
    //console.log(symbols.length);

    let exchangesSymbols = [];

    for (let name of exchanges) {
        exchangesSymbols.push({ id: name, symbols: [] });
    }

    let tickets = arbitrables.map(symbol => {
        //console.log(symbol);
        let row = {
            symbol,
            exchanges: []
        };

        for (let name of exchanges) {
            if (api[name].symbols.indexOf(symbol) >= 0) {
                //append ticket to exchangesSYmbols list
                exchangesSymbols.find(exch => exch.id === name).symbols.push(symbol);
                //                exchangesSymbols[name].symbols.push(symbol);
                row.exchanges.push(name);
            }
        }
        return row;
    });

    //console.log(tickets);

    console.info(
        "Exchanges:",
        colors.green(exchanges.length),
        "| Tickets:",
        colors.green(tickets.length)
    );
    return { tickets, exchangesSymbols };
}
