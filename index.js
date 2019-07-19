"use strict";

const market = require("./core/market");

(async function() {
    console.log("Trading Bot - Follow the money!");
    console.log("=======================================");

    market.initialize();
})();
