"use strict";

var moment = require("moment");
const colors = require("colors");
const { configs } = require("./core/arbitrage/settings");

/// agent 1 - opportunities search
const search = require("./core/arbitrage/search");
const quality = require("./core/arbitrage/quality");
const execution = require("./core/arbitrage/execution");
//const regulator = require("./core/arbitrage/execution");

global.verbose = true;
global.withdrawalFees = [];
global.exchanges = [];
global.api = {};

let searchCounter = 1;

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
    /// Search Agent
    /// Search for arbitrage signals and saves it on "Signals" mongoDB collection

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

    /// Remove signals older than X minutes / After X repeats

    // setInterval(function() {
    //     search.cleanup();
    //     verbose && console.info("S >> Cleaning >", moment().format("dddd, MMMM D YYYY, h:mm:ss a"));
    // }, (configs.search.cleanUpInterval > 0 ? configs.search.cleanUpInterval : 30) * 1000);

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /// Execution Agent
    ///

    // loop every x seconds
    execution.checkOrders();
    setInterval(function() {
        execution.checkOrders();
        verbose &&
            console.info("E >> Checking orders >", moment().format("dddd, MMMM D YYYY, h:mm:ss a"));
    }, (configs.execution.checkInterval > 0 ? configs.execution.checkInterval : 120) * 1000);
})();
