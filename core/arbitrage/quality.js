var moment = require("moment");
const colors = require("colors");

const configs = require("../../config/settings");
const execution = require("./execution");

const { getPercentageAfterWdFees } = require("./common");
const { fetchTrades, fetchBalance, fetchOrderBook } = require("../exchange");
const db = require("../db");

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// Qualifies all parallel opportunities on "opportunites" mongoDB collection
///
const initialize = async function() {
    ////////
    // remove opportunities created some time ago - wich does not have upadates
    ////////
    const minutesAgo = moment()
        .subtract(configs.arbitrage.quality.removeAfterMinutesOff, "minutes")
        .toDate();

    db.removeOpportunities({ $and: [{ created_at: { $lt: minutesAgo } }, { type: "PA" }] });

    ////////
    // remove poportunities with more than X iterractions and approved = false
    ////////
    db.removeOpportunities({
        $and: [
            // { approved: false },
            { type: "PA" },
            { $where: "this.lastest.length >= " + configs.arbitrage.quality.removeAfterIterations }
        ]
    });

    let opportunities = await db.readOpportunities({
        $and: [{ type: "PA", qualified: { $exists: false } }]
    });

    for (let opportunity of opportunities) {
        await callCheck(opportunity);
        //checkOpportunity(opportunity);
    }
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// Delays execution 300ms to avoid reject Access Denied (Too many requests)
///

function callCheck(opportunity) {
    return new Promise((resolve, reject) => {
        setTimeout(function() {
            //console.log("run", opportunity.id);
            checkOpportunity(opportunity);
            resolve(true);
        }, 500);
    });
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// Remove old and stucked opportunities
///

const cleanup = async function() {
    ////////
    // remove opportunities created some time ago - wich does not have upadates
    ////////
    const minutesAgo = moment()
        .subtract(configs.arbitrage.quality.removeAfterMinutesOff, "minutes")
        .toDate();

    db.removeOpportunities({ $and: [{ opp_created_at: { $lt: minutesAgo } }, { type: "PA" }] });

    ////////
    // remove poportunities with more than X iterractions and approved = false
    ////////
    db.removeOpportunities({
        $and: [
            // { approved: false },
            { type: "PA" },
            { $where: "this.lastest.length >= " + configs.arbitrage.quality.removeAfterIterations }
        ]
    });
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
///
///

async function checkOpportunity(opportunity) {
    let promises = [opportunity.buy_at, opportunity.sell_at].map(async exchange =>
        Promise.resolve(fetchTrades(exchange, opportunity.symbol))
    );

    Promise.all(promises).then(response => {
        //console.log(opportunity);
        //console.log(response);
        //console.log(opportunity.symbol);

        let quality = { buy: false, sell: false };
        opportunity.approved = false;

        console.log("");

        console.log(colors.yellow("Q >>"), opportunity.symbol);

        for (let excTrade of response) {
            //console.log(excTrade);

            if (excTrade.trades.length) {
                if (excTrade.id === opportunity.buy_at) {
                    let trades = excTrade.trades.find(trade => trade.side === "buy");
                    if (trades && trades.length !== 0) {
                        quality.buy = true;
                        console.log(excTrade.id, colors.cyan("buy"), excTrade.trades[0].datetime);
                    } else {
                        quality.buy = false;
                        console.log(excTrade.id, colors.magenta("no buy"));
                    }
                }

                if (excTrade.id === opportunity.sell_at) {
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

        opportunity.quality = quality;

        if (quality.sell && quality.buy) {
            // Approved on trading Activity, lets check orderBook
            checkOrderBook(opportunity);
        } else {
            opportunity.qualified = true;
            opportunity.approved = false;
            db.updateOpportunity(opportunity);
            console.log(colors.red("Q >>"), colors.red(opportunity.id));
        }

        // })
        // .catch(error => {
        //     console.error(colors.red("Error2:"), error.message);
    });
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
///
///

async function checkOrderBook(opportunity) {
    //let wallets = await fetchBalance(order.exchange);
    //console.log("wallets", wallets);

    console.log(colors.yellow("Q >> Checking orderBook..."), opportunity.id);

    let limit = 3;

    let promises = [opportunity.buy_at, opportunity.sell_at].map(async exchange =>
        Promise.resolve(await fetchOrderBook(exchange, opportunity.symbol))
    );

    Promise.all(promises).then(response => {
        //console.log(response);

        let bestAsk1 = { ...opportunity.bestAsk };
        let bestAsk2 = { ...opportunity.bestAsk };
        bestAsk1.ask = response[0].asks[0][0];
        bestAsk2.ask = response[0].asks[1][0];

        bestAsk1.amount = response[0].asks[0][1];
        bestAsk2.amount = response[0].asks[1][1];

        let bestBid1 = { ...opportunity.bestBid };
        let bestBid2 = { ...opportunity.bestBid };
        bestBid1.bid = response[1].bids[0][0];
        bestBid2.bid = response[1].bids[1][0];

        bestBid1.amount = response[1].bids[0][1];
        bestBid2.amount = response[1].bids[1][1];

        //get max amount of investiment
        // Row 1
        let amount1 = bestAsk1.amount;

        if (bestAsk1.amount > bestBid1.amount) {
            amount1 = bestBid1.amount;
        }

        let profit1 = getPercentageAfterWdFees(amount1 * bestAsk1.ask, bestAsk1, bestBid1);

        // Row 2
        let amount2 = bestAsk2.amount;

        if (bestAsk2.amount > bestBid2.amount) {
            amount2 = bestBid2.amount;
        }

        let profit2 = getPercentageAfterWdFees(amount2 * bestAsk2.ask, bestAsk2, bestBid2);

        console.log("Q >> Profit Row 1", profit1);
        console.log("Q >> Profit Row 2", profit2);

        opportunity.qualified = true;

        opportunity.ordersBook = {
            cheched_at: moment().toDate(),
            buy: {
                exchange: opportunity.buy_at,
                ask1: response[0].asks[0],
                ask2: response[0].asks[1]
            },
            sell: {
                exchange: opportunity.sell_at,
                bid1: response[1].bids[0],
                bid2: response[1].bids[1]
            }
        };

        opportunity.qualified = true;

        if (profit1 >= configs.arbitrage.search.minimumProfit) {
            opportunity.approved = true;
            opportunity.quality = { volume1: true };
            opportunity.amount_base = amount1;
            opportunity.amount_quote = amount1 / bestAsk1.ask;
            console.log(colors.green("Q >> Aproved Row 1"), colors.magenta(opportunity.id));
            // call execution
            execution.initialize(opportunity);
        } else if (profit2 >= configs.arbitrage.search.minimumProfit) {
            opportunity.approved = true;
            opportunity.quality = { volume2: true };
            opportunity.amount_base = amount2;
            opportunity.amount_quote = amount2 / bestAsk2.ask;
            console.log(colors.green("Q >> Aproved Row 2"), colors.magenta(opportunity.id));
            // call execution
            execution.initialize(opportunity);
        } else {
            opportunity.quality = { volume: false };
            opportunity.approved = false;
            console.log(colors.red("Q >> Not approved"), colors.red(opportunity.id));
            db.updateOpportunity(opportunity);
        }

        //arbitrage.checkOpportunity(response);
    });
}

module.exports = {
    initialize,
    cleanup,
    checkOpportunity
};