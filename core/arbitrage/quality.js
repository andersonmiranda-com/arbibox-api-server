var moment = require("moment");
const colors = require("colors");
const util = require("util");

const configs = require("../../config/settings");
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

        let activity = { buy: false, sell: false };
        opportunity.approved = false;

        console.log("");

        console.log(colors.yellow("Q >>"), opportunity.symbol);

        for (let excTrade of response) {
            //console.log(excTrade);

            if (excTrade.trades.length) {
                if (excTrade.id === opportunity.buy_at) {
                    let trades = excTrade.trades.find(trade => trade.side === "buy");
                    if (trades && trades.length !== 0) {
                        activity.buy = true;
                        console.log(excTrade.id, colors.cyan("buy"), excTrade.trades[0].datetime);
                    } else {
                        activity.buy = false;
                        console.log(excTrade.id, colors.magenta("no buy"));
                    }
                }

                if (excTrade.id === opportunity.sell_at) {
                    let trades = excTrade.trades.find(trade => trade.side === "sell");
                    if (trades && trades.length !== 0) {
                        activity.sell = true;
                        console.log(excTrade.id, colors.cyan("sell"), excTrade.trades[0].datetime);
                    } else {
                        activity.sell = false;
                        console.log(excTrade.id, colors.magenta("no sell"));
                    }
                }
            } else {
                console.log(excTrade.id, colors.red("inactive"));
            }
        }

        opportunity.activity = activity;

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

        console.log("Q >> Profit Line 1", calculateProfit(opportunity.chain, response, 0));
        console.log("Q >> Profit Line 2", calculateProfit(opportunity.chain, response, 1));

        opportunity.profit_queue1 = calculateProfit(opportunity.chain, response, 0);
        opportunity.profit_queue2 = calculateProfit(opportunity.chain, response, 1);

        opportunity.qualified = true;

        opportunity.ordersBook = {
            cheched_at: moment().toDate(),
            1: {
                symbol: opportunity.symbol1,
                side: opportunity.side1,
                ask: response[0].asks[0],
                bid: response[0].bids[0]
            },
            2: {
                symbol: opportunity.symbol2,
                side: opportunity.side2,
                ask: response[1].asks[0],
                bid: response[1].bids[0]
            },
            3: {
                symbol: opportunity.symbol3,
                side: opportunity.side3,
                ask: response[2].asks[0],
                bid: response[2].bids[0]
            }
        };

        if (opportunity.profit_queue1 >= configs.triangular.search.minimumProfit) {
            opportunity.approved = true;
            console.log(colors.green("Q >> Aproved"), colors.magenta(opportunity.id));
            // call execution
            execution.initialize(opportunity);
        } else {
            opportunity.qualified = true;
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
