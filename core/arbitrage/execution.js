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
    let opportunities = await db.readOpportunities({
        $and: [{ type: "AP", approved: true }]
    });

    for (let opportunity of opportunities) {
        //await callCheck(opportunity);
        prepareOrder(opportunity);
        console.log(colors.green("Executing..."), colors.cyan(opportunity.id));
    }
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// Prepara Order To be executed
///

async function prepareOrder(opportunity) {
    // remove from opportunities
    db.removeOpportunity({ id: opportunity.id });
    opportunity.ord_created_at = moment().toDate();
    // add to orders collection
    db.createOrder(opportunity);
}

module.exports = {
    initialize
};
