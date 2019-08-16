"use strict";

var moment = require("moment");
const colors = require("colors");
const configs = require("./config/settings");

/// agent 1 - opportunities finder
const finder = require("./core/arbitrage/finder");
const qualifier = require("./core/arbitrage/qualifier");

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

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /// Agent 2 - Qualifier
    /// Read opportunities from "opportunities" mongoDB collection and check quality. Remove bad ones

    qualifier.initialize();

    // loop every x seconds
    setInterval(function() {
        /// Agent 1 - Finder
        finder.findOpportunities(tickets, exchangesSymbols);
        /// Agent 2 - Qualifier
        qualifier.initialize();
        ///
        verbose &&
            console.info(
                "\n>> New search at",
                colors.magenta(moment().format("dddd, MMMM D YYYY, h:mm:ss a"))
            );
    }, (configs.checkInterval > 0 ? configs.checkInterval : 1) * 60000);
    verbose &&
        console.info(
            "\n>> Bot started at",
            colors.magenta(moment().format("dddd, MMMM Do YYYY, h:mm:ss a"))
        );
})();
