"use strict";

var moment = require("moment");
const colors = require("colors");
const configs = require("./config/settings");

/// agent 1 - opportunities finder
const finder = require("./core/arbitrage/finder");

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
    ///
    /// Aagent 1 - Finder
    /// Serach for arbitrage opportunities and saves it on a mongo DB collection

    const { tickets, exchangesSymbols } = await finder.initialize();
    finder.checkOpportunities(tickets, exchangesSymbols);

    // loop every x seconds
    setInterval(function() {
        finder.checkOpportunities(tickets, exchangesSymbols);
        verbose &&
            console.info(
                "\n>>>>>> Starting new search at",
                colors.magenta(moment().format("dddd, MMMM D YYYY, h:mm:ss a"))
            );
    }, (configs.checkInterval > 0 ? configs.checkInterval : 1) * 60000);
    verbose &&
        console.info(
            "\n>>>>>> Bot started at",
            colors.magenta(moment().format("dddd, MMMM Do YYYY, h:mm:ss a"))
        );
})();
