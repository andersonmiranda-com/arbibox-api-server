"use strict";

const configs = require("./config/settings");

/// agent 1 - opportunities finder
const finder = require("./core/arbitrage/finder");

global.verbose = true;

global.withdrawalFees = [];

(async function() {
    console.log("\n================================");
    console.log("Arbibox Bot - Show me the money!");
    console.log("================================");
    console.log("\nStarting Parallel Arbitrage...");
    verbose && console.info("\nLoading exchanges and tickets...");

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ///
    /// Aagent 1 - Finder
    /// Serach for arbitrage opportunities and saves it on a mongo DB collection

    const { tickets, exchangesSymbols } = await finder.initialize();
    finder.checkOpportunities(tickets, exchangesSymbols);

    // loop every x seconds
    setInterval(function() {
        finder.checkOpportunities(tickets, exchangesSymbols);
        verbose && console.info("\n>>>>>> Starting new search at", new Date());
    }, (configs.checkInterval > 0 ? configs.checkInterval : 1) * 60000);
    verbose && console.info("\n>>>>>> Bot started at", new Date());
})();
