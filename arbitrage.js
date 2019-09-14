"use strict";

var moment = require("moment");
const colors = require("colors");
const { configs } = require("./core/arbitrage/settings");

/// agent 1 - opportunities search
const search = require("./core/arbitrage/search");
const quality = require("./core/arbitrage/quality");
const execution = require("./core/arbitrage/execution");

global.verbose = true;

let searchCounter = 1;

global.withdrawalFees = [];

const logo = ` 
----------------------------------------------------------------

 $$$$$$\\            $$\\       $$\\ $$\\                           
$$  __$$\\           $$ |      \\__|$$ |                          
$$ /  $$ | $$$$$$\\  $$$$$$$\\  $$\\ $$$$$$$\\   $$$$$$\\  $$\\   $$\\ 
$$$$$$$$ |$$  __$$\\ $$  __$$\\ $$ |$$  __$$\\ $$  __$$\\ \\$$\\ $$  |
$$  __$$ |$$ |  \\__|$$ |  $$ |$$ |$$ |  $$ |$$ /  $$ | \\$$$$  / 
$$ |  $$ |$$ |      $$ |  $$ |$$ |$$ |  $$ |$$ |  $$ | $$  $$/  
$$ |  $$ |$$ |      $$$$$$$  |$$ |$$$$$$$  |\\$$$$$$  |$$  /\\$$\\ 
\\__|  \\__|\\__|      \\_______/ \\__|\\_______/  \\______/ \\__/  \\__|
                                                                
------------------- Crypto  Arbitrage  Bot --------------------- `;

(async function() {
    console.log(colors.green(logo));
    console.log(colors.cyan("\nStarting Parallel Arbitrage..."));
    configs.execution.simulationMode && console.info(colors.magenta("--- Simulation Mode ---"));

    verbose && console.info("\nLoading exchanges and tickets...");

    /// started
    verbose &&
        console.info("\n>>> Bot started at", moment().format("dddd, MMMM Do YYYY, h:mm:ss a"));

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /// Agent 1 - search
    /// Search for arbitrage opportunities and saves it on "opportunities" mongoDB collection

    const { tickets, exchangesSymbols, markets } = await search.initialize();

    console.info(
        "S >> Scan " + searchCounter + " >",
        moment().format("dddd, MMMM D YYYY, h:mm:ss a")
    );
    search.findSignals(tickets, exchangesSymbols, markets, searchCounter);

    // loop every x seconds

    setInterval(function() {
        searchCounter++;
        search.findSignals(tickets, exchangesSymbols, markets, searchCounter);
        verbose &&
            console.info(
                "S >> Scan " + searchCounter + " >",
                moment().format("dddd, MMMM D YYYY, h:mm:ss a")
            );
    }, (configs.search.checkInterval > 0 ? configs.search.checkInterval : 30) * 1000);

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /// Agent 2 - Quality
    /// Read opportunities from "opportunities" mongoDB collection and check quality. Remove bad ones

    // loop every x seconds

    setInterval(function() {
        quality.cleanup();
        verbose && console.info("Q >> Cleaning >", moment().format("dddd, MMMM D YYYY, h:mm:ss a"));
    }, (configs.quality.checkInterval > 0 ? configs.quality.checkInterval : 30) * 1000);

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /// Agent 3 - Execution
    ///

    // loop every x seconds
    execution.checkOrders();
    setInterval(function() {
        execution.checkOrders();
        verbose &&
            console.info("E >> Checking orders >", moment().format("dddd, MMMM D YYYY, h:mm:ss a"));
    }, (configs.execution.checkInterval > 0 ? configs.quality.checkInterval : 30) * 1000);
})();
