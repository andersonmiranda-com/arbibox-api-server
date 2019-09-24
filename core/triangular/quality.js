var moment = require("moment");
const colors = require("colors");
const lodash = require("lodash");

const util = require("util");

const { configs } = require("./settings");
const { fetchTrades, fetchBalance, fetchOrderBook } = require("../exchange");
const execution = require("./execution");

const db = require("../db");

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// Qualifies all parallel signals on "opportunites" mongoDB collection
///
const initialize = async function() {
    ////////
    // remove signals created some time ago - wich does not have upadates
    ////////
    const minutesAgo = moment()
        .subtract(configs.quality.removeAfterMinutesOff, "minutes")
        .toDate();

    db.removeSignals({ $and: [{ created_at: { $lt: minutesAgo } }, { type: "TR" }] });

    ////////
    // remove poportunities with more than X iterractions and approved = false
    ////////
    db.removeSignals({
        $and: [
            // { approved: false },
            { type: "TR" },
            { $where: "this.lastest.length >= " + configs.quality.removeAfterIterations }
        ]
    });

    let signals = await db.readSignals({
        $and: [{ type: "TR", qualified: { $exists: false } }]
    });

    for (let signal of signals) {
        await callCheck(signal);
        //checkSignal(signal);
    }
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// Remove old and stucked signals
///

const cleanup = async function() {
    ////////
    // remove signals created some time ago - wich does not have upadates
    ////////
    const minutesAgo = moment()
        .subtract(configs.quality.removeAfterMinutesOff, "minutes")
        .toDate();

    db.removeSignals({ $and: [{ opp_created_at: { $lt: minutesAgo } }, { type: "TR" }] });

    ////////
    // remove poportunities with more than X iterractions and approved = false
    ////////
    db.removeSignals({
        $and: [
            // { approved: false },
            { type: "TR" },
            { $where: "this.lastest.length >= " + configs.quality.removeAfterIterations }
        ]
    });
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// Delays execution 300ms to avoid reject Access Denied (Too many requests)
///

function callCheck(signal) {
    return new Promise((resolve, reject) => {
        setTimeout(function() {
            //console.log("run", signal.id);
            checkSignal(signal);
            resolve(true);
        }, 500);
    });
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
///
///

async function checkSignal(signal) {
    let checkedSignal = await db.readSignals({
        $and: [{ id: signal.id, qualified: { $exists: false } }]
    });
    if (checkedSignal.length === 0) return false;

    signal.qualified = true;
    db.updateSignal(signal);

    if (!configs.quality.tradeActivity) {
        checkOrderBook(signal);
        return;
    }

    let promises = [signal.symbol1, signal.symbol2, signal.symbol3].map(async symbol =>
        Promise.resolve(fetchTrades(signal.exchange, symbol))
    );

    Promise.all(promises).then(response => {
        //console.log(signal);
        //console.log(response);
        //console.log(signal.symbol);

        let quality = {};

        let activity = {};
        signal.approved = false;

        console.log("");

        console.log(colors.yellow("Q >>"), signal.id);

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

        signal.quality.activity = activity;

        if (symbolsOk === 3) {
            // Approved on trading Activity, lets check orderBook
            checkOrderBook(signal);
        } else {
            signal.approved = false;
            db.updateSignal(signal);
            console.log(colors.red("Q >>"), colors.red(signal.id));
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

function checkOrderBook(signal) {
    //let wallets = await fetchBalance(order.exchange);
    //console.log("wallets", wallets);

    console.log(colors.yellow("Q >>"), "Checking orderBook...", signal.id);
    let limit = 3;

    let coinChain = [signal.symbol1, signal.symbol2, signal.symbol3];

    let promises = coinChain.map(symbol =>
        Promise.resolve(fetchOrderBook(signal.exchange, symbol))
    );

    Promise.all(promises).then(response => {
        //console.log(response);

        signal.qualified = true;

        signal.ordersBook = {
            cheched_at: moment().toDate(),
            1: {
                symbol: signal.symbol1,
                side: signal.side1,
                ask: response[0].asks[0],
                bid: response[0].bids[0]
            },
            2: {
                symbol: signal.symbol2,
                side: signal.side2,
                ask: response[1].asks[0],
                bid: response[1].bids[0]
            },
            3: {
                symbol: signal.symbol3,
                side: signal.side3,
                ask: response[2].asks[0],
                bid: response[2].bids[0]
            }
        };

        let maxInvest = calcMaxInvest(signal.ordersBook);

        if (maxInvest < signal.chain.symbols[0].limits.amount.min) {
            signal.qualified = true;
            signal.approved = false;
            signal.quality = {
                score: 0,
                note: "Max invest is too low",
                checked_at: moment().toDate()
            };

            console.log(colors.red("Q >>"), "Not approved - Max invest is too low", signal.id);
            db.updateSignal(signal);
            return false;
        }

        let profit1 = calculateProfit(signal.chain, response, 0);
        let profit2 = calculateProfit(signal.chain, response, 1);

        console.log("Q >>", "Profit Row 1", signal.profit1);
        console.log("Q >>", "Profit Row 2", signal.profit2);

        if (profit1 >= configs.search.minimumProfit) {
            signal.profit_percent = profit1;
            signal.approved = true;
            signal.quality = {
                score: 5,
                checked_at: moment().toDate()
            };
            console.log(colors.green("Q >> Signal Aproved"), colors.magenta(signal.id));
            signal.invest = { max: { quote: maxInvest } };
            // call execution
            execution.initialize(signal);
        } else {
            signal.quality = {
                score: 0,
                note: "Insuficient volume in orderBook",
                checked_at: moment().toDate()
            };
            signal.approved = false;
            console.log(
                colors.red("Q >>"),
                "Not approved - Insuficient volume in orderBook",
                colors.red(signal.id)
            );
            db.updateSignal(signal);
        }

        //arbitrage.checkSignal(response);
    });
}

const calculateProfit = (chain, orders, row) => {
    const target = chain.targetAsset;
    const [symbol1, symbol2, symbol3] = chain.symbols;

    const a = getPrice(symbol1, orders, row);
    const b = getPrice(symbol2, orders, row);
    const c = getPrice(symbol3, orders, row);

    const fee1 = symbol1.taker;
    const fee2 = symbol2.taker;
    const fee3 = symbol3.taker;
    const profit = 100 * a * (1 - fee1) * b * (1 - fee2) * c * (1 - fee3) - 100;

    return profit;
};

const getPrice = (symbol, orders, row) => {
    let price = 0;

    let order = orders.find(o => o.symbol === symbol.symbol);

    if (order) {
        if (symbol.side === "buy") {
            price = 1 / order.asks[row][0];
        } else if (symbol.side === "sell") {
            price = order.bids[row][0];
        }
        return price;
    } else {
        return 0;
    }
};

function calcMaxInvest(ordersBook) {
    let investMax1 = 0;
    let multiplier1 = 0;
    if (ordersBook["1"].side === "sell") {
        investMax1 = ordersBook["1"].bid[1];
        multiplier1 = 1 / ordersBook["1"].bid[0];
    } else {
        investMax1 = ordersBook["1"].ask[1] * ordersBook["1"].ask[0];
        multiplier1 = ordersBook["1"].ask[0];
    }

    let investMax3 = 0;
    let multiplier3 = 0;

    if (ordersBook["3"].side === "buy") {
        investMax3 = ordersBook["3"].ask[1];
        multiplier3 = 1 / ordersBook["3"].ask[0];
    } else {
        investMax3 = ordersBook["3"].bid[1] * ordersBook["3"].bid[0];
        multiplier3 = ordersBook["3"].bid[0];
    }

    let investMax2 = 0;
    if (ordersBook["2"].side === "buy") {
        investMax2 = ordersBook["2"].ask[1] * ordersBook["2"].ask[0] * multiplier1;
    } else {
        investMax2 = ordersBook["2"].bid[1] * ordersBook["2"].bid[0] * multiplier3;
    }

    let maxInvest = lodash.min([investMax1, investMax2, investMax3]);

    return maxInvest;

    /*
    console.log(
        order.id,
        maxInvest,
        order.chain.symbols[0].limits.amount.min,
    );
    if (maxInvest >= order.chain.symbols[0].limits.amount.min) {
        console.log(order.id, "approved", maxInvest);
    }
    */
}

module.exports = {
    initialize,
    cleanup,
    checkSignal
};
