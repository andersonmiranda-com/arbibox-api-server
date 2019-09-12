var moment = require("moment");
const lodash = require("lodash");
const colors = require("colors");
const util = require("util");

const { configs } = require("./settings");
const db = require("../db");
const { fetchBalance, fetchOrderBook } = require("../exchange");

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
///
///

const initialize = async function(opportunity) {
    console.log(colors.green("E >> Opportunity created..."), colors.cyan(opportunity.id));
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

const prepareOrder = opportunity => {
    // remove from opportunities
    //db.removeOpportunities({ id: order.id });
    delete opportunity._id;
    opportunity.opp_created_at = moment().toDate();
    // add to orders collection
    db.addOpportunity(opportunity);
};

module.exports = {
    initialize,
    test
};
