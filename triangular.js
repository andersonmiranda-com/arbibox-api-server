"use strict";

var moment = require("moment");
const colors = require("colors");

const configs = require("./config/settings-triangular");

const search = require("./core/triangular/search");
const quality = require("./core/triangular/quality");
const execution = require("./core/triangular/execution");

global.verbose = true;

const args = process.argv;

let searchCounter = 1;

const interval =
    1000 *
    (args[3] ? args[3] : configs.search.checkInterval > 0 ? configs.search.checkInterval : 60);

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
    console.log(colors.cyan("\nStarting Triangular Arbitrage..."));
    verbose && console.info("\nLoading exchanges and tickets...");

    /// started
    verbose &&
        console.info("\n>> Bot started at", moment().format("dddd, MMMM Do YYYY, h:mm:ss a"));

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /// Agent 1 - Search
    /// Search for arbitrage opportunities and saves it on "opportunities" mongoDB collection

    //db.removeAllOpportunities();
    let targetAssets = configs.search.targetAssets;
    const exchangesChainData = await search.initialize();
    console.info(
        "S >> Scan " + searchCounter + " >",
        moment().format("dddd, MMMM D YYYY, h:mm:ss a")
    );

    search.findOpportunities(exchangesChainData, searchCounter);

    // loop every x seconds
    setInterval(function() {
        searchCounter++;
        search.findOpportunities(exchangesChainData, searchCounter);
        console.info(
            "S >> Scan " + searchCounter + " >",
            moment().format("dddd, MMMM D YYYY, h:mm:ss a")
        );
    }, interval);

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /// Agent 2 - Quality
    /// Remove old and stucked opportunities

    // loop every x seconds
    setInterval(function() {
        quality.cleanup();
        verbose && console.info("Q >> Cleaning >", moment().format("dddd, MMMM D YYYY, h:mm:ss a"));
    }, (configs.quality.checkInterval > 0 ? configs.quality.checkInterval : 30) * 1000);

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /// Agent 3 - Execution
    ///

    // loop every x seconds
    // setInterval(function() {
    //     verbose &&
    //         console.info(
    //             "E >> Starting >",
    //             moment().format("dddd, MMMM D YYYY, h:mm:ss a")
    //         );
    //     execution.initialize();
    // }, (configs.execution.checkInterval > 0
    //     ? configs.execution.checkInterval
    //     : 30) * 1000);
})();
