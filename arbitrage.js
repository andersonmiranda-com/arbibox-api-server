"use strict";

var moment = require("moment");
const colors = require("colors");
const configs = require("./config/settings");

/// agent 1 - opportunities finder
const finder = require("./core/arbitrage/finder");
const qualifier = require("./core/arbitrage/qualifier");
const execution = require("./core/arbitrage/execution");

global.verbose = true;

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
    verbose && console.info("\nLoading exchanges and tickets...");

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /// Agent 1 - Finder
    /// Search for arbitrage opportunities and saves it on "opportunities" mongoDB collection

    const { tickets, exchangesSymbols } = await finder.initialize();
    finder.findOpportunities(tickets, exchangesSymbols);

    // loop every x seconds
    setInterval(function() {
        finder.findOpportunities(tickets, exchangesSymbols);
        verbose &&
            console.info(
                "\n>> Finder agent >",
                colors.magenta(moment().format("dddd, MMMM D YYYY, h:mm:ss a"))
            );
    }, (configs.finder.checkInterval > 0 ? configs.finder.checkInterval : 30) * 1000);

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /// Agent 2 - Qualifier
    /// Read opportunities from "opportunities" mongoDB collection and check quality. Remove bad ones

    // loop every x seconds
    setInterval(function() {
        qualifier.initialize();
        verbose &&
            console.info(
                "\n>> Qualifier agent >",
                colors.magenta(moment().format("dddd, MMMM D YYYY, h:mm:ss a"))
            );
    }, (configs.quality.checkInterval > 0 ? configs.quality.checkInterval : 30) * 1000);

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /// Agent 3 - Execution
    ///

    // loop every x seconds
    setInterval(function() {
        verbose &&
            console.info(
                "\n>> Execution agent >",
                colors.magenta(moment().format("dddd, MMMM D YYYY, h:mm:ss a"))
            );
        execution.initialize();
    }, (configs.execution.checkInterval > 0 ? configs.execution.checkInterval : 30) * 1000);

    /// started
    verbose &&
        console.info(
            "\n>> Bot started at",
            colors.magenta(moment().format("dddd, MMMM Do YYYY, h:mm:ss a"))
        );
})();
