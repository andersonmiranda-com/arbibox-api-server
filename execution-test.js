"use strict";

const execution = require("./core/arbitrage/execution");

(async function() {
    console.log("");
    console.log("======================");
    console.log("Arbibox Execution test");
    console.log("======================");

    execution.initialize();
})();
