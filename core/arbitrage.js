"use strict";

const lodash = require("lodash");
const configs = require("../config/settings");
const colors = require("colors");
const util = require("util");
const { Parser } = require("json2csv");
const fs = require("fs");

let lastOpportunities = [];

exports.checkOpportunity = async function(prices) {
    let bestBid = lodash.maxBy(prices, function(item) {
        return item.bid;
    });

    let bestAsk = lodash.minBy(prices, function(item) {
        return item.ask;
    });

    if (bestBid.bid > bestAsk.ask) {
        console.log("\n\n--------------------------------- !!!!!!! ");
        console.log(prices);
        console.log(bestBid.bid);
        console.log(bestAsk.ask);

        let funds = getFunds();
        let amount = funds / bestAsk.ask;

        let bought = bestAsk.ask * amount;
        let sould = bestBid.bid * amount;

        let cost = bought * bestAsk.cost + sould * bestBid.cost;

        let estimatedGain = (sould - (bought + cost)).toFixed(2);
        let percentage = (estimatedGain / funds) * 100;

        let opportunity = {
            id: bestAsk.ticket.toLowerCase() + "-" + bestAsk.name + "-" + bestBid.name,
            created_at: new Date(),
            ticket: bestAsk.ticket,
            amount: Number(amount.toFixed(8)),
            buy_at: bestAsk.name,
            ask: bestAsk.ask,
            sale_at: bestBid.name,
            bid: bestBid.bid,
            gain: Number(percentage.toFixed(4))
        };

        let index = lastOpportunities.indexOf(opportunity.id);
        if (index == -1 && percentage >= configs.arbitrage.openOpportunity) {
            console.log("");
            console.info("✔ Opportunity found:".green);
            console.info(
                "  Estimated gain:",
                colors.green(percentage),
                "% |",
                colors.green(estimatedGain)
            );
            console.info(
                "\n",
                util.inspect(opportunity, {
                    colors: true
                })
            );

            register(opportunity);
            lastOpportunities.push(opportunity.id);
        } else if (index != -1 && percentage <= configs.arbitrage.closeOpportunity) {
            console.log("");
            console.info(colors.yellow("✔ Opportunity closed: %s"), opportunity.id);
            lastOpportunities.splice(index);
        }
    }
};

function getFunds() {
    return 1.0;
}

function register(opportunity) {
    const fields = [
        "id",
        "created_at",
        "ticket",
        "amount",
        "buy_at",
        "ask",
        "sale_at",
        "bid",
        "gain"
    ];

    const opts = { fields, header: false };
    const json2csvParser = new Parser(opts);

    let jsonData = JSON.stringify(opportunity);

    try {
        let csv = json2csvParser.parse(opportunity) + "\r\n";
        fs.appendFile("data/results-arbitrage.csv", csv, function(err) {
            if (err) throw err;
        });
        fs.appendFile("data/results-arbitrage.json", jsonData + ",\r\n", function(err) {
            if (err) throw err;
        });
    } catch (error) {
        console.error(colors.red("Error:"), error.message);
    }
}
