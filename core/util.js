"use strict";

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

    try {
        if (getBase(symbol) === inputTarget) {
            return ticker ? ticker.info.bidPrice || ticker.info.bid || ticker.bid : 0;
        } else {
            return inversePrice(ticker ? ticker.info.askPrice || ticker.info.ask || ticker.ask : 0);
        }
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

module.exports = {
    getBase,
    getQuote,
    inversePrice,
    getMultiplier,
    getConnectingAsset
};
