var moment = require("moment");
const lodash = require("lodash");
const configs = require("../../config/settings");
const { fetchBalance, fetchOrderBook } = require("../exchange");

const colors = require("colors");
const util = require("util");

const db = require("../db");

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// Qualifies all parallel opportunities on "opportunites" mongoDB collection
///

const initialize = async function() {
    let opportunities = await db.readOpportunities({
        $and: [{ type: "TR", approved: true }]
    });

    for (let opportunity of opportunities) {
        db.removeOpportunities({ id: opportunity.id });
        delete opportunity._id;
        checkOrder(opportunity);
        console.log(colors.green("E >> Executing..."), colors.cyan(opportunity.id));
    }
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// Qualifies all parallel opportunities on "opportunites" mongoDB collection
///

const test = async function() {
    let orders = await db.readOrders({
        $and: [{ type: "TR" }]
    });

    for (let order of orders) {
        //await callCheck(opportunity);
        delete order._id;
        console.log(colors.green("E >> Testing..."), colors.cyan(order.id));
        checkOrder(order);
    }
    //checkOrder(orders[0]);
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// Prepara Order To be executed
///

// async function prepareOrder(opportunity) {
//     // remove from opportunities
//     db.removeOpportunities({ id: opportunity.id });
//     opportunity.created_at = moment().toDate();
//     // add to orders collection
//     db.createOrder(opportunity);
// }

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
///
///

async function checkOrder(order) {
    //let wallets = await fetchBalance(order.exchange);
    //console.log("wallets", wallets);

    let limit = 3;

    let coinChain = [order.symbol1, order.symbol2, order.symbol3];

    let promises = coinChain.map(async symbol =>
        Promise.resolve(await fetchOrderBook(order.exchange, symbol))
    );

    Promise.all(promises).then(response => {
        //console.log(response);

        console.log("E >> coinChain", order.exchange);
        console.log("E >> Profit Line 1", calculateProfit(order.chain, response, 0));
        console.log("E >> Profit Line 2", calculateProfit(order.chain, response, 1));

        order.profit_queue1 = calculateProfit(order.chain, response, 0);
        order.profit_queue2 = calculateProfit(order.chain, response, 1);

        order.created_at_order = moment().toDate();

        order.ordersBook = {
            1: {
                symbol: order.symbol1,
                side: order.side1,
                ask: response[0].asks[0],
                bid: response[0].bids[0]
            },
            2: {
                symbol: order.symbol2,
                side: order.side2,
                ask: response[1].asks[0],
                bid: response[1].bids[0]
            },
            3: {
                symbol: order.symbol3,
                side: order.side3,
                ask: response[2].asks[0],
                bid: response[2].bids[0]
            }
        };

        // add to orders collection
        db.createOrder(order);

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
    test
};
