const configs = require("../../config/settings-arbitrage");

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
///
///

const getWithdrawalFee = currency => {
    let wd = withdrawalFees.find(fee => fee.coin === currency);
    return wd ? wd.withdrawalFee : 0;
};

const getPercentage = (bestAsk, bestBid) => {
    let { baseCurrency, quoteCurrency } = getCurrencies(bestAsk);

    let funds = configs.search.quoteCurrencyFunds[quoteCurrency];
    let amount = funds / bestAsk.ask;

    let bought = bestAsk.ask * amount;
    let sould = bestBid.bid * amount;

    let cost = bought * bestAsk.trade_fee + sould * bestBid.trade_fee;

    let estimatedGain = sould - (bought + cost);
    let percentage = (estimatedGain / funds) * 100;
    return percentage;
};

const getPercentageAfterWdFees = (funds, bestAsk, bestBid) => {
    let { baseCurrency, quoteCurrency } = getCurrencies(bestAsk);

    let baseWithdrawalFee = getWithdrawalFee(baseCurrency);
    let quoteWithdrawalFee = getWithdrawalFee(quoteCurrency);

    let bought = (funds / bestAsk.ask) * (1 - bestAsk.trade_fee);
    let sould =
        (bought - baseWithdrawalFee) * bestBid.bid * (1 - bestBid.trade_fee) - quoteWithdrawalFee;

    let estimatedGain = sould - funds; // Math.abs to make possible interpolation with goalSeek
    let percentage = (estimatedGain / Math.abs(funds)) * 100;

    let perc1 =
        (100 *
            (bestBid.bid *
                ((funds * (-bestAsk.trade_fee + 1)) / bestAsk.ask - baseWithdrawalFee) *
                (-bestBid.trade_fee + 1) -
                quoteWithdrawalFee -
                funds)) /
        funds;
    return percentage;
};

const getMinimunInversion = (bestAsk, bestBid) => {
    let { baseCurrency, quoteCurrency } = getCurrencies(bestAsk);

    let baseWithdrawalFee = getWithdrawalFee(baseCurrency);
    let quoteWithdrawalFee = getWithdrawalFee(quoteCurrency);

    // this formula was generated using HP Prime Calculator solve function
    // P
    //p=(100 * (bid * ((x * (-fa + 1)) / ask - wfb) * (-fb + 1) - wfq - x)) / x;

    //solve(p=profit,x)
    /*
    {
        (-100 * ask * bid * fb * wfb + 100 * ask * bid * wfb + 100 * ask * wfq) /
            (100 * bid * fa * fb -
                ask * profit -
                100 * bid * fa -
                100 * bid * fb -
                100 * ask +
                100 * bid);
    }
    */

    let minQuote =
        (-100 * bestAsk.ask * bestBid.bid * bestBid.trade_fee * baseWithdrawalFee +
            100 * bestAsk.ask * bestBid.bid * baseWithdrawalFee +
            100 * bestAsk.ask * quoteWithdrawalFee) /
        (100 * bestBid.bid * bestAsk.trade_fee * bestBid.trade_fee -
            bestAsk.ask * configs.search.minimumProfitInvest -
            100 * bestBid.bid * bestAsk.trade_fee -
            100 * bestBid.bid * bestBid.trade_fee -
            100 * bestAsk.ask +
            100 * bestBid.bid);

    let minBase = (minQuote / bestAsk.ask) * (1 - bestAsk.trade_fee) - baseWithdrawalFee;

    return { minQuote, minBase };
};

const getCurrencies = price => {
    let coins = price.symbol.split("/");
    let baseCurrency = coins[0];
    let quoteCurrency = coins[1];
    return { baseCurrency, quoteCurrency };
};

module.exports = {
    getWithdrawalFee,
    getPercentage,
    getPercentageAfterWdFees,
    getMinimunInversion,
    getCurrencies
};
