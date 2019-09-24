/* 
// Arbibox - Arbitrage bot
//
// Author: Anderson Miranda
// Email: me@andeesonmiranda.com
//
// trainagular-mix - Opportunity seeker in triagular format cross-exchanges
//
*/

"use strict";

var moment = require("moment");
const colors = require("colors");

const { configs } = require("./core/triangular-cross/settings");

const search = require("./core/triangular-cross/search");

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
    console.log(colors.cyan("\nStarting Cross Triangular Arbitrage..."));

    search.initialize();
})();
