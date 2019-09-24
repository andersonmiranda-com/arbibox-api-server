const moment = require("moment");
const lodash = require("lodash");
const colors = require("colors");

const { configs } = require("./settings");
const { apiKeys } = require("./settingsApiKeys");
const execution = require("./execution");

const { getPercentage, getPercentageAfterWdFees, getMinimunInversion } = require("./common");
const { fetchTrades, fetchBalance, fetchOrderBook } = require("../exchange");
const db = require("../db");

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// Qualifies all parallel signals on "opportunites" mongoDB collection
///

const initialize = async function() {
    let signals = await db.readSignals({
        type: "AP",
        buy_at_low_volume: false,
        sell_at_low_volume: false
    });
    await callCheck(signals[0]);
    // for (let signal of signals) {
    //     await callCheck(signal);
    // }
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// Delays execution 300ms to avoid reject Access Denied (Too many requests)
///

function callCheck(signal) {
    return new Promise((resolve, reject) => {
        setTimeout(function() {
            //console.log("run", opportunity.id);
            checkSignal(signal);
            resolve(true);
        }, 500);
    });
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// checkSignal
///

async function checkSignal(signal) {
    let checkedSignal = await db.readSignals({
        $and: [{ code: signal.code, time_block: signal.time_block, qualified: { $exists: false } }]
    });
    if (checkedSignal.length === 0) return false;

    signal.qualified = true;
    db.updateSignal(signal);

    if (!configs.quality.tradeActivity) {
        checkOrderBook(signal);
        return;
    }

    let promises = [signal.buy_at, signal.sell_at].map(exchange =>
        Promise.resolve(fetchTrades(exchange, signal.symbol))
    );

    Promise.all(promises).then(async response => {
        //console.log(signal);
        //console.log(response);
        //console.log(signal.symbol);

        let quality = { buy: false, sell: false, checked_at: moment().toDate() };
        signal.approved = false;

        console.log("");

        console.log(colors.yellow("Q >>"), signal.symbol);

        for (let excTrade of response) {
            //console.log(excTrade);

            if (excTrade.trades.length) {
                if (excTrade.id === signal.buy_at) {
                    let trades = excTrade.trades.find(trade => trade.side === "buy");
                    if (trades && trades.length !== 0) {
                        quality.buy = true;
                        console.log(excTrade.id, colors.cyan("buy"), excTrade.trades[0].datetime);
                    } else {
                        quality.buy = false;
                        console.log(excTrade.id, colors.magenta("no buy"));
                    }
                }

                if (excTrade.id === signal.sell_at) {
                    let trades = excTrade.trades.find(trade => trade.side === "sell");
                    if (trades && trades.length !== 0) {
                        quality.sell = true;
                        console.log(excTrade.id, colors.cyan("sell"), excTrade.trades[0].datetime);
                    } else {
                        quality.sell = false;
                        console.log(excTrade.id, colors.magenta("no sell"));
                    }
                }
            } else {
                console.log(excTrade.id, colors.red("inactive"));
            }
        }

        signal.quality = quality;

        if (quality.sell && quality.buy) {
            // Approved on trading Activity, lets check orderBook
            signal.quality.score = 3;
            checkOrderBook(signal);
        } else {
            signal.approved = false;
            signal.quality = {
                note: "Inactive trading",
                checked_at: moment().toDate()
            };
            signal.quality.score = 0;
            db.updateSignal(signal);
            console.log(colors.red("Q >>"), colors.red(signal.code));
        }

        // })
        // .catch(error => {
        //     console.error(colors.red("Error2:"), error.message);
    });
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// checkOrderBook
///

function checkOrderBook(signal) {
    //let wallets = await fetchBalance(order.exchange);
    //console.log("wallets", wallets);

    console.log(colors.yellow("Q >>"), "Checking orderBook...", signal.code);

    let limit = 3;

    let promises = [signal.buy_at, signal.sell_at].map(exchange =>
        Promise.resolve(fetchOrderBook(exchange, signal.symbol))
    );

    Promise.all(promises).then(async response => {
        //console.log(response);

        signal.ordersBook = {
            cheched_at: moment().toDate(),
            buy: {
                exchange: signal.buy_at,
                ask1: response[0].asks[0],
                ask2: response[0].asks[1]
            },
            sell: {
                exchange: signal.sell_at,
                bid1: response[1].bids[0],
                bid2: response[1].bids[1]
            }
        };

        let bestDeal = getMaxInversion(
            response[0].asks,
            response[1].bids,
            signal.bestAsk,
            signal.bestBid
        );

        if (bestDeal.profit_percent < configs.search.minimumProfit) {
            signal.quality = {
                note: "Profit smaller than target",
                checked_at: moment().toDate()
            };
            signal.quality.score = 0;
            signal.approved = false;
            console.log(
                colors.red("Q >>"),
                "Not approved - Profit smaller than target",
                signal.code
            );
            db.updateSignal(signal);
            return;
        }

        let costBuy = bestDeal.amount * signal.bestAsk.ask;
        let costSell = bestDeal.amount * signal.bestBid.bid;

        if (
            bestDeal.amount < signal.bestAsk.minAmount ||
            bestDeal.amount < signal.bestBid.minAmount ||
            costBuy < signal.bestAsk.minCost ||
            costSell < signal.bestBid.minCost
        ) {
            signal.quality = {
                note: "Volume in orderBook < minimun allowed",
                checked_at: moment().toDate()
            };
            signal.quality.score = 0;
            signal.approved = false;
            console.log(
                colors.red("Q >>"),
                "Not approved - Volume in orderBook < minimun allowed",
                signal.code
            );
            db.updateSignal(signal);
            return;
        }

        //console.log("profit1", signal.code, profit1);

        let thisbestAsk = { ...signal.bestAsk };
        let thisbestBid = { ...signal.bestBid };

        thisbestAsk.ask = bestDeal.ask;
        thisbestBid.bid = bestDeal.bid;

        //update original profit
        //signal.profit_percent = bestDeal.profit_percent;
        signal.approved = true;
        signal.quality = { note: "row1", checked_at: moment().toDate() };
        signal.quality.score = 5;
        // min
        if (configs.loopWithdraw) {
            let { minQuote, minBase } = getMinimunInversion(thisbestAsk, thisbestBid);

            signal.invest.min = {
                base: minBase.toFixed(8),
                quote: minQuote.toFixed(8),
                profit_percent: configs.search.minimumProfitInvest.toFixed(4),
                profit: (minQuote * (configs.search.minimumProfitInvest / 100)).toFixed(8)
            };
        } else {
            let minInvestBase = lodash.max([thisbestAsk.minAmount, thisbestBid.minAmount]);
            let minInvestQuote = lodash.max([thisbestAsk.minCost, thisbestBid.minCost]);

            signal.invest.min = {
                base: minInvestBase.toFixed(8),
                quote: minInvestQuote.toFixed(8),
                profit_percent: configs.search.minimumProfitInvest.toFixed(4),
                profit: (
                    thisbestAsk.minAmount *
                    thisbestAsk.ask *
                    (configs.search.minimumProfitInvest / 100)
                ).toFixed(8)
            };
        }

        signal.invest.max = {
            base: bestDeal.amount.toFixed(8),
            quote: (bestDeal.amount * thisbestAsk.ask).toFixed(8),
            profit_percent: bestDeal.profit_percent.toFixed(4),
            profit: (bestDeal.amount * thisbestAsk.ask * (bestDeal.profit_percent / 100)).toFixed(8)
        };

        configs.loopWithdraw && console.log("Q >>", "Invest Min", signal.invest.min);
        console.log(
            "Q >> Profit",
            bestDeal.profit_percent.toFixed(4),
            "%",
            signal.invest.max.profit
        );
        console.log(colors.green("Q >>"), "Signal Approved", signal.code);

        // check wallet
        checkWallet(signal);
    });
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// check Wallet
///

async function checkWallet(signal) {
    //check API KEYS

    signal.wallets = {
        buy: { exchange: signal.buy_at },
        sell: { exchange: signal.sell_at }
    };

    if (!apiKeys[signal.buy_at] || !apiKeys[signal.sell_at]) {
        signal.approved = false;

        if (!apiKeys[signal.buy_at]) {
            signal.wallets.buy.status = "No API Keys";
        }
        if (!apiKeys[signal.sell_at]) {
            signal.wallets.sell.status = "No API Keys";
        }

        console.log(colors.red("Q >>"), "No API Keys", signal.code);

        signal.quality.execution_note = "No API Keys";
        signal.status = "No API Keys";

        db.upsertLostOpportunity(signal);

        //prepare to withdraw
        return false;
    }

    // get Wallets Balances
    //
    let buyWallets = await fetchBalance(signal.buy_at);
    let sellWallets = await fetchBalance(signal.sell_at);

    signal.wallets.buy[signal.base] =
        buyWallets.free[signal.base] || buyWallets.total[signal.base] || 0;

    signal.wallets.buy[signal.quote] =
        buyWallets.free[signal.quote] || buyWallets.total[signal.quote] || 0;

    signal.wallets.sell[signal.base] =
        sellWallets.free[signal.base] || sellWallets.total[signal.base] || 0;

    signal.wallets.sell[signal.quote] =
        sellWallets.free[signal.quote] || sellWallets.total[signal.quote] || 0;

    // Check funds
    //

    let buyAmount = lodash.min([
        signal.wallets.buy[signal.quote] / signal.bestAsk.ask,
        signal.wallets.sell[signal.base],
        signal.invest.max.base
    ]);

    let costBuy = buyAmount * signal.bestAsk.ask;
    let costSell = buyAmount * signal.bestBid.bid;

    if (
        buyAmount < signal.invest.min.base ||
        costBuy < signal.bestAsk.minCost ||
        costSell < signal.bestBid.minCost
    ) {
        insuficientFunds = true;
        signal.approved = false;

        signal.wallets.buy.status = "";
        signal.wallets.sell.status = "";

        if (signal.wallets.buy[signal.quote] < signal.invest.min.quote) {
            signal.wallets.buy.status = "Insuficient";
        }

        if (signal.wallets.sell[signal.base] < signal.invest.min.base) {
            signal.wallets.sell.status = "Insuficient";
        }

        if (costBuy < signal.bestAsk.minCost) {
            signal.wallets.buy.status += " - Cost < min allowed - " + signal.bestAsk.minCost;
        }

        if (costSell < signal.bestBid.minCost) {
            signal.wallets.sell.status += " - Cost < min allowed - " + signal.bestBid.minCost;
        }

        console.log(colors.red("Q >>"), "Insuficient funds", signal.code);

        signal.quality.execution_note = "Insuficient funds";
        signal.status = "Insuficient funds";

        db.upsertLostOpportunity(signal);

        //prepare to withdraw
        return false;
    }

    if (!configs.execution.simulationMode) {
        let opportunity = { ...signal };
        delete opportunity._id;

        opportunity.opp_created_at = moment().toDate();

        // add to opportunities collection
        opportunity._id = await db.addOpportunity(opportunity);
        console.log(colors.green("Q >>"), "Opportunity created...", opportunity.code);

        // call execution
        execution.initialize(opportunity);
    }
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// Auxiliay functions
///

function getMaxInversion(asks, bids, bestAsk, bestBid) {
    let positions = 5;
    let bestValue = { profit_percent: 0, amount: 0, ask: {}, bid: {} };
    let lastProfit = 0;

    let thisbestAsk = { ...bestAsk };
    let thisbestBid = { ...bestBid };

    for (var pa = 0; pa < positions; pa++) {
        for (var pb = 0; pb < positions; pb++) {
            console.log(asks[pa], bids[pb]);
        }
    }

    return bestValue;
}

function orderBookProfits(asks, bids, bestAsk, bestBid) {
    let positions = [1, 2, 3, 4, 5];
    let bestValue = { profit_percent: 0, amount: 0, ask: {}, bid: {} };
    let lastProfit = 0;

    let thisbestAsk = { ...bestAsk };
    let thisbestBid = { ...bestBid };

    positions.map(p => {
        let ask = weightedMeanOrderBook(asks, p);
        let bid = weightedMeanOrderBook(bids, p);

        let amount = lodash.min([ask.amount, bid.amount]);

        thisbestAsk.ask = ask.price;
        thisbestBid.bid = bid.price;

        if (configs.loopWithdraw) {
            profit_percent = getPercentageAfterWdFees(amount * ask.price, thisbestAsk, thisbestBid);
        } else {
            profit_percent = getPercentage(thisbestAsk, thisbestBid);
        }

        //console.log(profit_perc, profit_perc * amount, lastProfit);

        if (
            profit_percent >= configs.search.minimumProfit &&
            profit_percent * amount > lastProfit
        ) {
            bestValue = { profit_percent, amount, ask: ask.price, bid: bid.price };
        }
        lastProfit = profit_percent * amount;
    });

    return bestValue;
}

function weightedMeanOrderBook(orderBook, elements) {
    let values = [];
    let volume = [];
    let sumVolume = 0;

    let initArray = orderBook.slice(0, elements);

    initArray.forEach(line => {
        values.push(line[0]);
        volume.push(line[1]);
        sumVolume = sumVolume + line[1];
    });

    //console.log(values, volume);
    return {
        price: weightedMean(values, volume),
        amount: sumVolume
    };
}

function weightedMean(arrValues, arrWeights) {
    var result = arrValues
        .map(function(value, i) {
            var weight = arrWeights[i];
            var sum = value * weight;

            return [sum, weight];
        })
        .reduce(
            function(p, c) {
                return [p[0] + c[0], p[1] + c[1]];
            },
            [0, 0]
        );

    return result[0] / result[1];
}

module.exports = {
    initialize,
    checkSignal
};
