const ccxt = require("ccxt");
var moment = require("moment");
const lodash = require("lodash");
const configs = require("../../config/settings");
const colors = require("colors");
const util = require("util");

const db = require("../db");

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// Qualifies all parallel opportunities on "opportunites" mongoDB collection
///
const initialize = async function() {
    let opportunities = await db.readOpportunities({ type: "AP" });
    await checkOpportunity(opportunities[0]);
    for (let opportunity of opportunities) {
        await checkOpportunity(opportunity);
    }
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
///
///

async function checkOpportunity(opportunity) {
    try {
        let promises = [opportunity.buy_at, opportunity.sale_at].map(async exchange =>
            Promise.resolve(await fetchTrades(exchange, opportunity.symbol))
        );

        Promise.all(promises)
            .then(
                async response => {
                    //console.log(opportunity);
                    //console.log(response);
                    console.log(">>>> ", opportunity.symbol);

                    for (let excTrade of response) {
                        console.log(excTrade.id);
                        if (excTrade.trades.length) {
                            let now = moment();
                            let lastTrade = moment(excTrade.trades[0].datetime);
                            console.log(
                                excTrade.trades[0].datetime,
                                now.diff(lastTrade, "minutes")
                            );
                        }
                    }
                }

                //arbitrage.checkOpportunity(response);
            )
            .catch(error => {
                console.error(colors.red("Error2:"), error.message);
            });
    } catch (error) {
        console.error(colors.red("Error FetchTrades:"), error.message);
    }
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
///
///

async function fetchTrades(exchange, symbol) {
    var exchangeInfo = {
        id: exchange,
        trades: [],
        wallets: []
    };

    try {
        var _exchange;

        if (configs.keys[exchange]) {
            _exchange = new ccxt[exchange]({
                apiKey: configs.keys[exchange].apiKey,
                secret: configs.keys[exchange].secret,
                timeout: configs.apiTimeout * 1000,
                enableRateLimit: true
            });
            exchangeInfo.wallets = await _exchange.fetchBalance();
            db.saveWallets(exchangeTickets.id, {
                id: exchangeTickets.id,
                free: exchangeTickets.wallets.free,
                total: exchangeTickets.wallets.total
            });
        } else {
            _exchange = new ccxt[exchange]({
                timeout: configs.apiTimeout * 1000,
                enableRateLimit: true
            });
            exchangeInfo.wallets = [];
        }

        let since = _exchange.milliseconds() - 3600000; // -1 day from now
        let limit = 1;
        exchangeInfo.trades = await _exchange.fetchTrades(symbol, null, limit);

        //tickets.map(ticket => verbose && console.log(ticket));
    } catch (error) {
        console.error(colors.red("Error:"), error.message);
        return exchangeInfo;
    } finally {
        return exchangeInfo;
    }
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// Find best opportiunities (Calculates profit for each group of tickets
///
/// Input: prices: an array of objects with ask/bid of each exchange all with the same ticket
///
/// Output: saves
///

function filterOpportunities(prices) {
    return new Promise(async (resolve, reject) => {
        let opportunities = [];
        let { baseCurrency, quoteCurrency } = getCurrencies(prices[0]);
        db.removeOldOpportunitiesByTicket(prices[0].ticket);
        for (let priceAsk of prices) {
            if (
                configs.quality.filter.lowVolume &&
                (!priceAsk.baseVolume ||
                    !priceAsk.quoteVolume ||
                    priceAsk.baseVolume <= configs.quality.filter.baseLowVolumeLimit ||
                    priceAsk.quoteVolume <=
                        configs.quality.filter.quoteLowVolumeLimit[quoteCurrency])
            ) {
                continue;
            }
            for (let priceBid of prices) {
                if (
                    configs.quality.filter.lowVolume &&
                    (!priceBid.baseVolume ||
                        !priceBid.quoteVolume ||
                        priceBid.baseVolume <= configs.quality.filter.baseLowVolumeLimit ||
                        priceBid.quoteVolume <=
                            configs.quality.filter.quoteLowVolumeLimit[quoteCurrency])
                ) {
                    continue;
                }
                if (priceAsk.ask < priceBid.bid) {
                    opportunities.push({ bestAsk: priceAsk, bestBid: priceBid });
                    //verbose && console.log("\n\nbestBid:", priceBid);
                    //verbose && console.log("bestAsk:", priceAsk);
                }
            }
        }

        for (let op of opportunities) {
            let { bestAsk, bestBid } = op;

            let percentage = getPercentage(bestAsk, bestBid);

            let baseWithdrawalFee = getWithdrawalFee(baseCurrency);
            let quoteWithdrawalFee = getWithdrawalFee(quoteCurrency);

            let percentageAfterWdFees1 = getPercentageAfterWdFees(
                configs.quality.quoteCurrencyFunds[quoteCurrency],
                bestAsk,
                bestBid
            );
            if (percentageAfterWdFees1 >= configs.minimumProfit) {
                let { minQuote, minBase } = getMinimunInversion(bestAsk, bestBid);
                let percentageAfterWdFees2 = getPercentageAfterWdFees(minQuote, bestAsk, bestBid);
                let opportunity = {
                    id: bestAsk.ticket.toLowerCase() + "-" + bestAsk.name + "-" + bestBid.name,
                    created_at: new Date(),
                    ticket: bestAsk.ticket,

                    buy_at: bestAsk.name,
                    buy: {
                        at: bestAsk.name,
                        ask: bestAsk.ask,
                        volume_base: bestAsk.baseVolume,
                        volume_quote: bestAsk.quoteVolume,
                        wd_fee_quote: quoteWithdrawalFee
                    },

                    sale_at: bestBid.name,
                    sale: {
                        at: bestBid.name,
                        bid: bestBid.bid,
                        volume_base: bestBid.baseVolume,
                        volume_quote: bestBid.quoteVolume,
                        wd_fee_base: baseWithdrawalFee
                    },

                    invest_min: {
                        base: minBase,
                        quote: minQuote,
                        profit_min: Number(percentageAfterWdFees2.toFixed(4))
                    },
                    //bids: bidOrders.bids,
                    invest: configs.quality.quoteCurrencyFunds[quoteCurrency],
                    profit0: Number(percentage.toFixed(4)),
                    profit1: Number(percentageAfterWdFees1.toFixed(4))
                };

                verbose && console.log("");
                verbose && console.info("✔ Opportunity found:".green);
                verbose &&
                    console.info("  Estimated gain:", colors.green(percentage.toFixed(4)), "%");
                verbose &&
                    console.info(
                        "\n",
                        util.inspect(opportunity, {
                            colors: true
                        })
                    );
                db.upsertOpportunity(opportunity);
            }
        }
        resolve();
    });
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
///
///

function getWithdrawalFee(currency) {
    let wd = withdrawalFees.find(fee => fee.coin === currency);
    return wd ? wd.withdrawalFee : 0;
}

function getPercentage(bestAsk, bestBid) {
    let { baseCurrency, quoteCurrency } = getCurrencies(bestAsk);

    let funds = configs.quality.quoteCurrencyFunds[quoteCurrency];
    let amount = funds / bestAsk.ask;

    let bought = bestAsk.ask * amount;
    let sould = bestBid.bid * amount;

    let cost = bought * bestAsk.cost + sould * bestBid.cost;

    let estimatedGain = sould - (bought + cost);
    let percentage = (estimatedGain / funds) * 100;
    return percentage;
}

function getPercentageAfterWdFees(funds, bestAsk, bestBid) {
    let { baseCurrency, quoteCurrency } = getCurrencies(bestAsk);

    let baseWithdrawalFee = getWithdrawalFee(baseCurrency);
    let quoteWithdrawalFee = getWithdrawalFee(quoteCurrency);

    let bought = (funds / bestAsk.ask) * (1 - bestAsk.cost);
    let sould =
        (bought - baseWithdrawalFee) * bestBid.bid * (1 - bestBid.cost) - quoteWithdrawalFee;

    let estimatedGain = sould - funds; // Math.abs to make possible interpolation with goalSeek
    let percentage = (estimatedGain / Math.abs(funds)) * 100;

    let perc1 =
        (100 *
            (bestBid.bid *
                ((funds * (-bestAsk.cost + 1)) / bestAsk.ask - baseWithdrawalFee) *
                (-bestBid.cost + 1) -
                quoteWithdrawalFee -
                funds)) /
        funds;
    return percentage;
}

function getMinimunInversion(bestAsk, bestBid) {
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
        (-100 * bestAsk.ask * bestBid.bid * bestBid.cost * baseWithdrawalFee +
            100 * bestAsk.ask * bestBid.bid * baseWithdrawalFee +
            100 * bestAsk.ask * quoteWithdrawalFee) /
        (100 * bestBid.bid * bestAsk.cost * bestBid.cost -
            bestAsk.ask * configs.minimumProfitInvest -
            100 * bestBid.bid * bestAsk.cost -
            100 * bestBid.bid * bestBid.cost -
            100 * bestAsk.ask +
            100 * bestBid.bid);

    let minBase = (minQuote / bestAsk.ask) * (1 - bestAsk.cost) - baseWithdrawalFee;

    return { minQuote, minBase };
}

function getCurrencies(price) {
    let coins = price.ticket.split("/");
    let baseCurrency = coins[0];
    let quoteCurrency = coins[1];
    return { baseCurrency, quoteCurrency };
}

module.exports = {
    initialize
};