"use strict";

var moment = require("moment");
const colors = require("colors");

const configs = require("./config/settings");

const search = require("./core/triangular/search");
const quality = require("./core/triangular/quality");
const execution = require("./core/triangular/execution");

global.verbose = true;

const args = process.argv;

let searchCounter = 1;

const interval =
    1000 *
    (args[3]
        ? args[3]
        : configs.triangular.search.checkInterval > 0
        ? configs.triangular.search.checkInterval
        : 60);

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
        console.info(
            "\n>> Bot started at",
            colors.magenta(moment().format("dddd, MMMM Do YYYY, h:mm:ss a"))
        );

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /// Agent 1 - Search
    /// Search for arbitrage opportunities and saves it on "opportunities" mongoDB collection

    //db.removeAllOpportunities();
    let targetAssets = configs.triangular.search.targetAssets;
    const { exchanges, markets } = await search.initialize();
    console.info(
        "S >> Scan " + searchCounter + " >",
        colors.magenta(moment().format("dddd, MMMM D YYYY, h:mm:ss a"))
    );
    search.findOpportunities(exchanges, markets, targetAssets, searchCounter);

    // loop every x seconds
    setInterval(function() {
        searchCounter++;
        search.findOpportunities(exchanges, markets, targetAssets, searchCounter);
        console.info(
            "S >> Scan " + searchCounter + " >",
            colors.magenta(moment().format("dddd, MMMM D YYYY, h:mm:ss a"))
        );
    }, interval);

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /// Agent 2 - Quality
    /// Remove old and stucked opportunities

    // loop every x seconds
    setInterval(function() {
        quality.cleanup();
        verbose &&
            console.info(
                "Q >> Cleaning >",
                colors.magenta(moment().format("dddd, MMMM D YYYY, h:mm:ss a"))
            );
    }, (configs.triangular.quality.checkInterval > 0
        ? configs.triangular.quality.checkInterval
        : 30) * 1000);

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /// Agent 3 - Execution
    ///

    // loop every x seconds
    // setInterval(function() {
    //     verbose &&
    //         console.info(
    //             "E >> Starting >",
    //             colors.magenta(moment().format("dddd, MMMM D YYYY, h:mm:ss a"))
    //         );
    //     execution.initialize();
    // }, (configs.triangular.execution.checkInterval > 0
    //     ? configs.triangular.execution.checkInterval
    //     : 30) * 1000);
})();
