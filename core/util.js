"use strict";

const configs = require("../config/settings");

const colors = require("colors");

const getBase = symbol => symbol.base || symbol.market.base;
const getQuote = symbol => symbol.quote || symbol.market.quote;
const inversePrice = n => 1 / n;

const getConnectingAsset = (symbol, target) => {
    const base = getBase(symbol);
    const quote = getQuote(symbol);

    if (base === target) {
        return quote;
    } else if (quote === target) {
        return base;
    } else {
        throw "the target asset " + target + " does not occur in symbol " + symbol.symbol;
    }
};

// if the symbol is ETH/BTC
const getMultiplier = (symbol, inputTarget, ticker) => {
    // inputTarget is the asset for which coins are available now
    // and they are trade for the other asset in a symbol
    // if the inputTarget is the base of the symbol

    //console.log("ticker", ticker);
    //cccccconsole.log("ticker.info", ticker.info);

    let multiplier = 0;

    try {
        if (getBase(symbol) === inputTarget) {
            multiplier = ticker ? ticker.info.bidPrice || ticker.info.bid || ticker.bid : 0;
        } else {
            multiplier = inversePrice(
                ticker ? ticker.info.askPrice || ticker.info.ask || ticker.ask : 0
            );
        }

        //console.log("F >>", symbol.symbol);

        if (
            configs.triangular.quality.filter.lowVolume &&
            (!ticker.baseVolume ||
                !ticker.quoteVolume ||
                ticker.baseVolume <= configs.triangular.quality.filter.baseLowVolumeLimit ||
                ticker.quoteVolume <=
                    configs.triangular.quality.filter.quoteLowVolumeLimit[getQuote(symbol)])
        ) {
            multiplier = 0;
            //console.log(colors.red("F >>"), symbol.symbol, "Low Volume");
        }

        return multiplier;
        //
    } catch (error) {
        //console.error(colors.red("Error getMultiplier"), error.message);
        //console.error(colors.red("Error getMultiplier"), error);
        //console.log();
        //console.log("symbol", symbol);
        //console.log("inputTarget", inputTarget);
        //console.log("ticker", ticker);
        // error - no correspondent ticker available
        //return 0;
    }
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// Calculate the profit for tha chain
///

const calculateChainProfit = (exchange, chain, tickers) => {
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

    const fee1 = symbol1.taker;
    const fee2 = symbol2.taker;
    const fee3 = symbol3.taker;
    const difference = 100 * a * (1 - fee1) * b * (1 - fee2) * c * (1 - fee3) - 100;

    chain.triagePercentage = difference;
    return chain;
};

module.exports = {
    getBase,
    getQuote,
    inversePrice,
    getMultiplier,
    getConnectingAsset,
    calculateChainProfit
};
