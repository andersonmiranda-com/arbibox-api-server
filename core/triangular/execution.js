var moment = require("moment");
const lodash = require("lodash");
const colors = require("colors");
const util = require("util");

const configs = require("../../config/settings");
const db = require("../db");
const { fetchBalance, fetchOrderBook } = require("../exchange");

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
///
///

const initialize = async function(opportunity) {
    console.log(colors.green("E >> Executing..."), colors.cyan(opportunity.id));
    prepareOrder(opportunity);
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

const prepareOrder = order => {
    // remove from opportunities
    db.removeOpportunities({ id: order.id });
    delete order._id;
    order.ord_created_at = moment().toDate();
    // add to orders collection
    db.createOrder(order);
    console.log(colors.green("E >> Created..."), colors.cyan(order.id));
};

module.exports = {
    initialize,
    test
};
