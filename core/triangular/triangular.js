const ccxt = require("ccxt");
const lodash = require("lodash");
const configs = require("../config/settings");
const { getConnectingAsset, getMultiplier } = require("../util");
const colors = require("colors");
const z = require("zero-fill");
const n = require("numbro");

const verbose = false;

const colorProfit = percentage => (percentage > 0 ? `${percentage}`.green : `${percentage}`.red);

exports.initialize = async function() {
    let targetAssets = configs.triangular.targetAssets;
    try {
        console.info("\nLoading exchanges and tickets...");
        //db.removeAllOpportunities();
        const { exchanges, markets } = await prepareExchanges();
        console.info("Bot started at", new Date());
        for (let exchange of exchanges) {
            await findChains(targetAssets, exchange, markets);
            //setInterval(function() {
            //    startArbitrageByTicket(ticket);
            //}, (configs.checkInterval > 0 ? configs.checkInterval : 1) * 60000);
        }
        //console.log("----------------------------- new");
    } catch (error) {
        console.error(colors.red("Error1:"), error.message);
    }
};

class Chain {
    constructor(targetAsset, symbols) {
        this.targetAsset = targetAsset;
        this.symbols = symbols;
        this.triagePercentage = 100;
    }

    toString() {
        return this.targetAsset + " '" + this.symbols.map(s => s.symbol).join("','") + "'";
    }

    getHashKey() {
        return this.targetAsset + "-" + this.symbols.map(s => s.symbol).join("-");
    }
}

async function findChains(targetAssets, exchange, markets) {
    //return new Promise(async (resolve, reject) => {
    var _exchange;

    //try {
    if (configs.keys[exchange]) {
        _exchange = new ccxt[exchange]({
            apiKey: configs.keys[exchange].apiKey,
            secret: configs.keys[exchange].secret,
            timeout: configs.apiTimeout * 1000
            //enableRateLimit: true
        });
    } else {
        _exchange = new ccxt[exchange]({
            timeout: configs.apiTimeout * 1000
            //enableRateLimit: true
        });
    }

    tickers = await _exchange.fetchTickers();

    exchangeMarket = markets.find(market => market.id === exchange);
    for (let targetAsset of targetAssets) {
        let chains = prepareChains(targetAsset, exchangeMarket.markets);

        for (const chain of chains) {
            chainResult = await calculateChainProfit(
                exchange,
                chain,
                tickers,
                exchangeMarket.markets
            );

            if (chain.triagePercentage >= 0) {
                console.log(
                    exchange.id,
                    chain + "; triage: " + colorProfit(chain.triagePercentage) + " %"
                );
            }
            //     console.log(".");
            // }
            // console.log(
            //     z(13, exchange, " "),
            //     z(40, chainResult, " "),
            //     " triage: ",
            //     chainResult.triagePercentage + " %"
            // );
        }
        //} catch (error) {
        //    console.log("Error on ", targetAsset);
        //    return false;
        //}
    }
    return true;
    //    resolve(true);
    //});
}

function prepareChains(targetAsset, markets) {
    let { sourceSymbols, compatibleSymbols } = symbolFinder(targetAsset, markets);

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
}

function symbolFinder(targetAsset, markets) {
    verbose &&
        console.log(
            "There are " +
                Object.getOwnPropertyNames(markets).length +
                " total symbols on this exchange."
        );
    verbose && console.log("Looking for all " + targetAsset + " symbols:");
    let sourceSymbols = [];
    let otherAssetIds = [];

    Object.keys(markets).forEach(function(key) {
        symbol = markets[key];

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
    });

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
    Object.keys(markets).forEach(function(key) {
        symbol = markets[key];
        if (otherAssetIds.indexOf(symbol.base) != -1 && otherAssetIds.indexOf(symbol.quote) != -1) {
            compatibleSymbols.push(symbol);
        }
    });
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

function matchSymbol(targetAsset, symbol1, symbol2, symbol3) {
    try {
        let c1 = getConnectingAsset(symbol1, targetAsset); // 'ETH/BTC' c1 = ETH
        let c2 = getConnectingAsset(symbol2, c1); // 'QTUM/ETH' c2 = QTUM
        let c3 = getConnectingAsset(symbol3, targetAsset); // 'QTUM/BTC' c3 = QTUM

        return c3 === c2;
    } catch (error) {
        return false;
    }

    return false;
}

const substractFee = fee => amount => {
    let res = amount - amount * fee;
    return res;
};

function calculateChainProfit(exchange, chain, tickers, markets) {
    const target = chain.targetAsset;
    const [symbol1, symbol2, symbol3] = chain.symbols;

    let ticker1 = tickers[symbol1.symbol];
    let ticker2 = tickers[symbol2.symbol];
    let ticker3 = tickers[symbol3.symbol];

    const a = Number(getMultiplier(symbol1, target, ticker1), 10);

    // Get second multiplier
    const connectingAsset1 = getConnectingAsset(symbol1, target);
    const b = getMultiplier(symbol2, connectingAsset1, ticker2);

    // Get third multiplier
    const connectingAsset2 = getConnectingAsset(symbol2, connectingAsset1);
    const c = getMultiplier(symbol3, connectingAsset2, ticker3);

    let market1 = markets[symbol1.symbol];
    let market2 = markets[symbol2.symbol];
    let market3 = markets[symbol3.symbol];

    const fee1 = market1.taker;
    const fee2 = market2.taker;
    const fee3 = market3.taker;

    const difference = 100 * a * (1 - fee1) * b * (1 - fee2) * c * (1 - fee3) - 100;

    chain.triagePercentage = difference;
    return chain;
}

async function prepareExchanges() {
    let exchanges = configs.triangular.exchanges;
    let markets = [];

    if (configs.marketFilter.exchangesBlacklist) {
        exchanges = lodash.difference(exchanges, configs.marketFilter.exchangesBlacklist);
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
            if (_instance.has["fetchTickers"]) {
                markets.push({ id: name, markets: _instance.markets });
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

    verbose && console.info("Exchanges:", colors.green(exchanges.length));
    return { exchanges, markets };
}
