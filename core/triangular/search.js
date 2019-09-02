const ccxt = require("ccxt");
var moment = require("moment");
const lodash = require("lodash");
const colors = require("colors");
const z = require("zero-fill");
const n = require("numbro");

const configs = require("../../config/settings");
const quality = require("./quality");

const db = require("../db");
const { calculateChainProfit, getConnectingAsset, getSides } = require("../util");
const { fetchTickers } = require("../exchange");

global.api = {};

const args = process.argv;
const verbose = false;
const colorProfit = percentage => (percentage > 0 ? `${percentage}`.green : `${percentage}`.red);

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

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// Prepare Exchanges
///

const initialize = async function() {
    //initialize oppotunities table
    db.removeOpportunities({ type: "TR" });

    let exchanges = [];

    if (configs.marketFilter.exchanges) {
        exchanges = configs.exchanges;
    } else {
        exchanges = ccxt.exchanges;
    }

    if (args[2]) {
        exchanges = [args[2]];
    }

    if (configs.marketFilter.exchangesBlacklist) {
        exchanges = lodash.difference(exchanges, configs.exchangesBlacklist);
    }

    let markets = [];

    if (configs.marketFilter.exchangesBlacklist) {
        exchanges = lodash.difference(exchanges, configs.marketFilter.exchangesBlacklist);
    }

    let checkedExchanges = [...exchanges];

    for (let i = 0; i < exchanges.length; i++) {
        let name = exchanges[i];
        var start1 = new Date();

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
            var end1 = new Date() - start1;

            console.log("Loading markets for", colors.green(name), "-", end1, "ms");
            //CCXT API Exchange validation
            if (!_instance.has["fetchTickers"]) {
                console.error(colors.red("Error: Exchange has no fetchTickers:"), name);
                checkedExchanges.splice(checkedExchanges.indexOf(name), 1);
            } else if (!_instance.has["fetchOrderBook"]) {
                console.error(colors.red("Error: Exchange has no fetchOrderBook:"), name);
                checkedExchanges.splice(checkedExchanges.indexOf(name), 1);
            } else if (!_instance.has["fetchTrades"]) {
                console.error(colors.red("Error: Exchange has no fetchTrades:"), name);
                checkedExchanges.splice(checkedExchanges.indexOf(name), 1);
            } else {
                markets.push({ id: name, markets: _instance.markets });
                api[name] = _instance;
                //db.saveExchange(name, { symbols: _instance.symbols, markets: _instance.markets });
            }
        } catch (error) {
            console.error(colors.red("Error1:"), error.message);
            console.error(colors.red("Error initiating:"), name);
            checkedExchanges.splice(checkedExchanges.indexOf(name), 1);
        }
    }

    exchanges = [...checkedExchanges];

    verbose && console.info("Exchanges:", colors.green(exchanges.length));
    return { exchanges, markets };
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// Build a Queue
///
function findOpportunities(exchanges, markets, targetAssets, searchCounter) {
    let promises = exchanges.map(exchange =>
        Promise.resolve(findChains(targetAssets, exchange, markets))
    );

    Promise.all(promises).then(response => {
        console.info(
            "S >> Scan " + searchCounter + " finished >",
            colors.magenta(moment().format("dddd, MMMM D YYYY, h:mm:ss a"))
        );
        //console.info(">>> Triangular scan finished at", new Date());

        return true;
        //console.log(response);
    });
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// Find Possible Chains
///

async function findChains(targetAssets, exchange, markets) {
    //return new Promise(async (resolve, reject) => {

    tickers = await fetchTickers(exchange);

    exchangeMarkets = markets.find(market => market.id === exchange).markets;
    for (let targetAsset of targetAssets) {
        console.log("S >>", targetAsset, colors.cyan(exchange));

        let chains = prepareChains(targetAsset, exchangeMarkets);

        for (const chain of chains) {
            try {
                chainResult = calculateChainProfit(exchange, chain, tickers);

                /* console.log(
                    chain + "; triage: " + colorProfit(chainResult.triagePercentage) + " %"
                ); */

                if (
                    chainResult.triagePercentage >= configs.triangular.search.minimumProfit &&
                    chainResult.triagePercentage <= 200 &&
                    chainResult.triagePercentage !== Infinity
                ) {
                    try {
                        let finalChain = getSides(chainResult);

                        let opportunity = {
                            id:
                                exchange.toLowerCase() +
                                "_" +
                                targetAsset +
                                "_" +
                                finalChain.symbols[0].symbol +
                                "-" +
                                finalChain.symbols[1].symbol +
                                "-" +
                                finalChain.symbols[2].symbol,
                            type: "TR",
                            opp_created_at: new Date(),
                            chain: finalChain,
                            exchange: exchange,
                            base: targetAsset,
                            side1: finalChain.symbols[0].side,
                            side2: finalChain.symbols[1].side,
                            side3: finalChain.symbols[2].side,
                            symbol1: finalChain.symbols[0].symbol,
                            symbol2: finalChain.symbols[1].symbol,
                            symbol3: finalChain.symbols[2].symbol,
                            profit: Number(finalChain.triagePercentage.toFixed(4))
                        };

                        await db.upsertOpportunity(opportunity);

                        ////
                        ////

                        quality.checkOpportunity(opportunity);

                        ////
                        ////

                        console.log(
                            colors.green("S >>"),
                            exchange,
                            "|",
                            targetAsset,
                            "|",
                            finalChain.symbols[0].symbol,
                            ">",
                            finalChain.symbols[1].symbol,
                            ">",
                            finalChain.symbols[2].symbol,
                            "|",
                            "profit:",
                            colorProfit(finalChain.triagePercentage) + " %"
                        );
                    } catch (error) {
                        console.error(colors.red("S >> Error4:"), error.message);
                        //return false;
                    }
                }

                //console.log(
                //    z(13, exchange, " "),
                //    z(40, chainResult, " "),
                //    " triage: ",
                //    chainResult.triagePercentage + " %"
                //);
            } catch (error) {
                console.error(
                    colors.red("S >> Error on:"),
                    colors.magenta(targetAsset),
                    colors.cyan(exchange)
                );
                console.error(colors.red("S >> Error3"), error.message);
                //console.error(colors.red("Error3"), error);
                //return false
            }
        }
        //return true;
        //    resolve(true);
        //});
    }
}

function prepareChains(targetAsset, markets) {
    let { sourceSymbols, compatibleSymbols } = symbolSearch(targetAsset, markets);

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

function symbolSearch(targetAsset, markets) {
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
                if (configs.marketFilter.baseCurrencies) {
                    if (lodash.includes(configs.baseCurrencies, symbol.base)) {
                        otherAssetIds.push(symbol.base);
                    }
                } else {
                    otherAssetIds.push(symbol.base);
                }
            }
            if (otherAssetIds.indexOf(symbol.quote) == -1 && symbol.quote != targetAsset) {
                if (configs.marketFilter.baseCurrencies) {
                    if (lodash.includes(configs.baseCurrencies, symbol.quote)) {
                        otherAssetIds.push(symbol.quote);
                    }
                } else {
                    otherAssetIds.push(symbol.quote);
                }
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
        if (
            otherAssetIds.indexOf(symbol.base) != -1 &&
            otherAssetIds.indexOf(symbol.quote) != -1 &&
            (lodash.includes(configs.baseCurrencies, symbol.base) &&
                lodash.includes(configs.baseCurrencies, symbol.quote))
        ) {
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

module.exports = {
    initialize,
    findOpportunities
};
