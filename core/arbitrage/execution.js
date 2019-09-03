var moment = require("moment");
const configs = require("../../config/settings-arbitrage");
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

const prepareOrder = opportunity => {
    // remove from opportunities
    //db.removeOpportunities({ id: order.id });
    delete opportunity._id;
    opportunity.ord_created_at = moment().toDate();
    // add to orders collection
    db.addToQueue(opportunity);
    console.log(colors.green("E >> Created..."), colors.cyan(opportunity.id));
};

module.exports = {
    initialize
};
