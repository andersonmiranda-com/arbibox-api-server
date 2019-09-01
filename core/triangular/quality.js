var moment = require("moment");
const colors = require("colors");
const util = require("util");

const configs = require("../../config/settings");
const { fetchTrades, fetchBalance, fetchOrderBook } = require("../exchange");
const execution = require("./execution");

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
        .subtract(configs.triangular.quality.removeAfterMinutesOff, "minutes")
        .toDate();

    db.removeOpportunities({ $and: [{ created_at: { $lt: minutesAgo } }, { type: "TR" }] });

    ////////
    // remove poportunities with more than X iterractions and approved = false
    ////////
    db.removeOpportunities({
        $and: [
            // { approved: false },
            { type: "TR" },
            { $where: "this.lastest.length >= " + configs.triangular.quality.removeAfterIterations }
        ]
    });

    let opportunities = await db.readOpportunities({
        $and: [{ type: "TR", qualified: { $exists: false } }]
    });

    for (let opportunity of opportunities) {
        await callCheck(opportunity);
        //checkOpportunity(opportunity);
    }
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// Remove old and stucked opportunities
///

const cleanup = async function() {
    ////////
    // remove opportunities created some time ago - wich does not have upadates
    ////////
    const minutesAgo = moment()
        .subtract(configs.triangular.quality.removeAfterMinutesOff, "minutes")
        .toDate();

    db.removeOpportunities({ $and: [{ opp_created_at: { $lt: minutesAgo } }, { type: "TR" }] });

    ////////
    // remove poportunities with more than X iterractions and approved = false
    ////////
    db.removeOpportunities({
        $and: [
            // { approved: false },
            { type: "TR" },
            { $where: "this.lastest.length >= " + configs.triangular.quality.removeAfterIterations }
        ]
    });
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
///
///

async function checkOpportunity(opportunity) {
    //checkOrderBook(opportunity);
    //return;

    let checkedOpportunity = await db.readOpportunities({
        $and: [{ id: opportunity.id, qualified: { $exists: false } }]
    });

    if (checkedOpportunity.length === 0) return false;

    let promises = [opportunity.symbol1, opportunity.symbol2, opportunity.symbol3].map(
        async symbol => Promise.resolve(fetchTrades(opportunity.exchange, symbol))
    );

    Promise.all(promises).then(response => {
        //console.log(opportunity);
        //console.log(response);
        //console.log(opportunity.symbol);

        let activity = {};
        opportunity.approved = false;

        console.log("");

        console.log(colors.yellow("Q >>"), opportunity.id);

        let symbolsOk = 0;

        for (let excTrade of response) {
            //console.log(excTrade);
            if (excTrade.trades && excTrade.trades.length >= 0) {
                if (excTrade.trades.length !== 0) {
                    activity[excTrade.symbol] = true;
                    console.log("Q >>", excTrade.id, excTrade.symbol, colors.green("active"));
                    symbolsOk++;
                } else {
                    activity[excTrade.symbol] = false;
                    console.log("Q >>", excTrade.id, excTrade.symbol, colors.magenta("inactive"));
                }
            } else {
                activity = false;
                console.log("Q >>", excTrade.id, colors.red("inactive"));
            }
        }

        opportunity.activity = activity;

        if (symbolsOk === 3) {
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

function checkOrderBook(opportunity) {
    //let wallets = await fetchBalance(order.exchange);
    //console.log("wallets", wallets);

    console.log(colors.yellow("Q >> Checking orderBook..."), opportunity.id);

    let limit = 3;

    let coinChain = [opportunity.symbol1, opportunity.symbol2, opportunity.symbol3];

    let promises = coinChain.map(symbol =>
        Promise.resolve(fetchOrderBook(opportunity.exchange, symbol))
    );

    Promise.all(promises).then(response => {
        //console.log(response);

        console.log("Q >> Profit Row 1", calculateProfit(opportunity.chain, response, 0));
        console.log("Q >> Profit Row 2", calculateProfit(opportunity.chain, response, 1));

        opportunity.profit_row1 = calculateProfit(opportunity.chain, response, 0);
        opportunity.profit_row2 = calculateProfit(opportunity.chain, response, 1);

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

        if (opportunity.profit_row1 >= configs.triangular.search.minimumProfit) {
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

const calculateProfit = (chain, orders, index) => {
    const target = chain.targetAsset;
    const [symbol1, symbol2, symbol3] = chain.symbols;

    const a = getPrice(symbol1, orders, index);
    const b = getPrice(symbol2, orders, index);
    const c = getPrice(symbol3, orders, index);

    const fee1 = symbol1.taker;
    const fee2 = symbol2.taker;
    const fee3 = symbol3.taker;
    const profit = 100 * a * (1 - fee1) * b * (1 - fee2) * c * (1 - fee3) - 100;

    return profit;
};

const getPrice = (symbol, orders, index) => {
    let price = 0;

    let order = orders.find(o => o.symbol === symbol.symbol);

    if (order) {
        if (symbol.side === "buy") {
            price = 1 / order.asks[index][0];
        } else if (symbol.side === "sell") {
            price = order.bids[index][0];
        }
        return price;
    } else {
        return 0;
    }
};

module.exports = {
    initialize,
    cleanup,
    checkOpportunity
};
