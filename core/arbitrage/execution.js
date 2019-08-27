var moment = require("moment");
const configs = require("../../config/settings");
const colors = require("colors");

const db = require("../db");

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// Qualifies all parallel opportunities on "opportunites" mongoDB collection
///

const initialize = async function(opportunity) {
    console.log(colors.green("E >> Executing..."), colors.cyan(opportunity.id));
    prepareOrder(opportunity);
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
    initialize
};
