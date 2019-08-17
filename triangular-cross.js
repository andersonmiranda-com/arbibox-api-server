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

const triangular = require("./core/triangular-cross/triangular-cross");

(async function() {
    console.log("Arbibox Triangular Inter Exchange Bot - Show me the money!");
    console.log("==========================================================");

    triangular.initialize();
})();
