"use strict";

const market = require("./core/market");

(async function() {
    console.log("Arbibox Arbitrage Bot - Show me the money!");
    console.log("==========================================");

    market.initialize();
})();
