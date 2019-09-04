const ccxt = require("ccxt");
const lodash = require("lodash");
const colors = require("colors");

const configs = require("../../config/settings-arbitrage");
const db = require("../db");

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// Prepare Tickets
///

const initialize = async function() {
    //initialize oppotunities table
    let exchanges = [];
    let markets = [];

    if (configs.marketFilter.exchanges) {
        exchanges = configs.exchanges;
    } else {
        exchanges = ccxt.exchanges;
    }

    if (configs.marketFilter.exchangesBlacklist) {
        exchanges = lodash.difference(exchanges, configs.exchangesBlacklist);
    }

    for (let i = 0; i < exchanges.length; i++) {
        let name = exchanges[i];
        var start1 = new Date();
        try {
            let withdraw = await require("../../wihdrawal_fees/" + name);

            let with1 = { ...withdraw };

            Object.keys(withdraw).forEach(function(key) {
                with1[key] = Number(withdraw[key], 10);
            });

            let fees = {
                exchange: name,
                withdraw: with1
            };
            await db.upsertFees(fees);
            console.log("Loaded withdrawal fees for", name);
        } catch (error) {
            console.error(colors.red("Error loading Currencies:"), name);
            console.error(colors.red("Error:"), error.message);
        }

        global.withdrawalFees = await db.getWithdrawalFees();
    }
};
module.exports = {
    initialize
};
