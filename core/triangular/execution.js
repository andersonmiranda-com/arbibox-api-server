var moment = require("moment");
const lodash = require("lodash");
const configs = require("../../config/settings");
const { getConnectingAsset, getMultiplier } = require("../util");
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
        //await callCheck(opportunity);
        prepareOrder(opportunity);
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

    // for (let order of orders) {
    //     //await callCheck(opportunity);
    //     console.log(colors.green("E >> Testing..."), colors.cyan(order.id));
    //     checkOrder(order);
    // }
    checkOrder(orders[0]);
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// Prepara Order To be executed
///

async function prepareOrder(opportunity) {
    // remove from opportunities
    db.removeOpportunities({ id: opportunity.id });
    opportunity.created_at = moment().toDate();
    // add to orders collection
    db.createOrder(opportunity);
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
///
///

async function checkOrder(order) {
    let wallets = await fetchBalance(order.exchange);
    console.log("wallets", wallets);

    let promises = [order.ticket1, order.ticket2, order.ticket3].map(async symbol =>
        Promise.resolve(await fetchOrderBook(order.exchange, symbol))
    );

    Promise.all(promises).then(response => {
        console.log("order", order);
        for (let orders of response) {
            console.log("orders", orders);
            // })
            // .catch(error => {
            //     console.error(colors.red("Error2:"), error.message);
        }
    });
}

module.exports = {
    initialize,
    test
};
