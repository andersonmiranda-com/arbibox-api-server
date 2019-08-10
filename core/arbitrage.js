"use strict";

const ccxt = require("ccxt");
const lodash = require("lodash");
const configs = require("../config/settings");
const colors = require("colors");
const util = require("util");
const { Parser } = require("json2csv");
const fs = require("fs");
const db = require("./db");

exports.checkOpportunity = function(prices) {
    return new Promise(async (resolve, reject) => {
        let opportunities = [];
        db.removeOpportunitiesByTicket(prices[0].ticket);
        for (let priceAsk of prices) {
            if (
                configs.filter.low_volume &&
                (!priceAsk.baseVolume ||
                    !priceAsk.quoteVolume ||
                    priceAsk.baseVolume <= configs.filter.low_base_volume_limit ||
                    priceAsk.quoteVolume <= configs.filter.lowquote_volume_limit)
            ) {
                continue;
            }
            for (let priceBid of prices) {
                if (
                    configs.filter.low_volume &&
                    (!priceBid.baseVolume ||
                        !priceBid.quoteVolume ||
                        priceBid.baseVolume <= configs.filter.low_base_volume_limit ||
                        priceBid.quoteVolume <= configs.filter.lowquote_volume_limit)
                ) {
                    continue;
                }
                if (priceAsk.ask < priceBid.bid) {
                    opportunities.push({ bestAsk: priceAsk, bestBid: priceBid });
                    //console.log("\n\nbestBid:", priceBid);
                    //console.log("bestAsk:", priceAsk);
                }
            }
        }

        for (let op of opportunities) {
            let { bestAsk, bestBid } = op;

            //let buy_qty = "";
            //let sell_qty = "";
            //let askOrders = [];
            //let bidOrders = [];
            //try {
            //     let askOrders = await fetchOrderBook(bestAsk.name, bestAsk.ticket);
            //     let bidOrders = await fetchOrderBook(bestBid.name, bestBid.ticket);
            //     let buy_qty = askOrders.asks[0][1];
            //     let sell_qty = bidOrders.bids[0][1];
            //} catch (error) {}

            let funds = getFunds();
            let amount = funds / bestAsk.ask;

            let bought = bestAsk.ask * amount;
            let sould = bestBid.bid * amount;

            let cost = bought * bestAsk.cost + sould * bestBid.cost;

            let estimatedGain = sould - (bought + cost);
            let percentage = (estimatedGain / funds) * 100;

            let opportunity = {
                id: bestAsk.ticket.toLowerCase() + "-" + bestAsk.name + "-" + bestBid.name,
                created_at: new Date(),
                ticket: bestAsk.ticket,
                amount: Number(amount.toFixed(8)),
                buy_at: bestAsk.name,
                //buy_qty: buy_qty,
                //sell_qty: sell_qty,
                ask: bestAsk.ask,
                //asks: askOrders.asks,
                sale_at: bestBid.name,
                bid: bestBid.bid,
                //bids: bidOrders.bids,
                askBaseVolume: bestAsk.baseVolume,
                bidBaseVolume: bestBid.baseVolume,
                askQuoteVolume: bestAsk.quoteVolume,
                bidQuoteVolume: bestBid.quoteVolume,
                gain: Number(percentage.toFixed(4))
            };

            if (percentage >= configs.openOpportunity) {
                console.log("");
                console.info("✔ Opportunity found:".green);
                console.info("  Estimated gain:", colors.green(percentage.toFixed(4)), "%");
                console.info(
                    "\n",
                    util.inspect(opportunity, {
                        colors: true
                    })
                );
                db.saveOpportunity(opportunity);
                //register(opportunity);

                // } else if (index != -1 && percentage <= configs.closeOpportunity) {
                //     console.log("");
                //     console.info(colors.yellow("✔ Opportunity closed: %s"), opportunity.id);
                //     lastOpportunities.splice(index);
                //     db.removeOpportunity(opportunity);
            }
        }
        resolve();
    });
};

function getFunds() {
    return 0.1;
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
        "baseVolume",
        "quoteVolume",
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

async function fetchOrderBook(exchange, symbol) {
    let orders = {};
    try {
        var _exchange;

        if (configs.keys[exchange]) {
            _exchange = new ccxt[exchange]({
                apiKey: configs.keys[exchange].apiKey,
                secret: configs.keys[exchange].secret,
                timeout: configs.api_timeout * 1000
                //enableRateLimit: true
            });
        } else {
            _exchange = new ccxt[exchange]({
                timeout: configs.api_timeout * 1000
                //enableRateLimit: true
            });
        }

        orders = await _exchange.fetchOrderBook(symbol, 5);
        return orders;
    } catch (error) {
        console.error(colors.red("Error fetchOrders:"), exchange, error.message);
        return orders;
    }
}
