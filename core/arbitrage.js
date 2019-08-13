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
        let { baseCurrency, quoteCurrency } = getCurrencies(prices[0]);
        db.removeOldOpportunitiesByTicket(prices[0].ticket);
        for (let priceAsk of prices) {
            if (
                configs.quality.filter.lowVolume &&
                (!priceAsk.baseVolume ||
                    !priceAsk.quoteVolume ||
                    priceAsk.baseVolume <= configs.quality.filter.baseLowVolumeLimit ||
                    priceAsk.quoteVolume <=
                        configs.quality.filter.quoteLowVolumeLimit[quoteCurrency])
            ) {
                continue;
            }
            for (let priceBid of prices) {
                if (
                    configs.quality.filter.lowVolume &&
                    (!priceBid.baseVolume ||
                        !priceBid.quoteVolume ||
                        priceBid.baseVolume <= configs.quality.filter.baseLowVolumeLimit ||
                        priceBid.quoteVolume <=
                            configs.quality.filter.quoteLowVolumeLimit[quoteCurrency])
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

            let percentage = getPercentage(bestAsk, bestBid);

            if (percentage >= configs.minimumProfit) {
                let baseWithdrawalFee = getWithdrawalFee(baseCurrency);
                let quoteWithdrawalFee = getWithdrawalFee(quoteCurrency);

                let percentageAfterWdFees1 = getPercentageAfterWdFees(
                    configs.quality.quoteCurrencyFunds[quoteCurrency],
                    bestAsk,
                    bestBid
                );
                let { minQuote, minBase } = getMinimunInversion(
                    configs.quality.quoteCurrencyFunds[quoteCurrency],
                    bestAsk,
                    bestBid
                );
                let percentageAfterWdFees2 = getPercentageAfterWdFees(minQuote, bestAsk, bestBid);
                let opportunity = {
                    id: bestAsk.ticket.toLowerCase() + "-" + bestAsk.name + "-" + bestBid.name,
                    created_at: new Date(),
                    ticket: bestAsk.ticket,
                    buy_at: bestAsk.name,
                    //buy_qty: buy_qty,
                    //sell_qty: sell_qty,
                    buy_ask: bestAsk.ask,
                    //asks: askOrders.asks,
                    sale_at: bestBid.name,
                    sale_bid: bestBid.bid,
                    //bids: bidOrders.bids,
                    volume_ask_base: bestAsk.baseVolume,
                    volume_bid_base: bestBid.baseVolume,
                    volume_ask_quote: bestAsk.quoteVolume,
                    volume_bid_quote: bestBid.quoteVolume,
                    wd_fee_base: baseWithdrawalFee,
                    wd_fee_quote: quoteWithdrawalFee,
                    invest_min_base: minBase,
                    invest_min_quote: minQuote,
                    invest: configs.quality.quoteCurrencyFunds[quoteCurrency],
                    profit0: Number(percentage.toFixed(4)),
                    profit1: Number(percentageAfterWdFees1.toFixed(4)),
                    profit_min: Number(percentageAfterWdFees2.toFixed(4))
                };

                console.log("");
                console.info("✔ Opportunity found:".green);
                console.info("  Estimated gain:", colors.green(percentage.toFixed(4)), "%");
                console.info(
                    "\n",
                    util.inspect(opportunity, {
                        colors: true
                    })
                );
                db.upsertOpportunity(opportunity);
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

function getWithdrawalFee(currency) {
    let wd = withdrawalFees.find(fee => fee.coin === currency);
    return wd ? wd.withdrawalFee : 0;
}

function getPercentage(bestAsk, bestBid) {
    let { baseCurrency, quoteCurrency } = getCurrencies(bestAsk);

    let funds = configs.quality.quoteCurrencyFunds[quoteCurrency];
    let amount = funds / bestAsk.ask;

    let bought = bestAsk.ask * amount;
    let sould = bestBid.bid * amount;

    let cost = bought * bestAsk.cost + sould * bestBid.cost;

    let estimatedGain = sould - (bought + cost);
    let percentage = (estimatedGain / funds) * 100;
    return percentage;
}

function getPercentageAfterWdFees(funds, bestAsk, bestBid) {
    let { baseCurrency, quoteCurrency } = getCurrencies(bestAsk);

    let baseWithdrawalFee = getWithdrawalFee(baseCurrency);
    let quoteWithdrawalFee = getWithdrawalFee(quoteCurrency);

    let bought = (funds / bestAsk.ask) * (1 - bestAsk.cost);
    let sould =
        (bought - baseWithdrawalFee) * bestBid.bid * (1 - bestBid.cost) - quoteWithdrawalFee;

    let estimatedGain = sould - funds; // Math.abs to make possible interpolation with goalSeek
    let percentage = (estimatedGain / Math.abs(funds)) * 100;

    let perc1 =
        (100 *
            (bestBid.bid *
                ((funds * (-bestAsk.cost + 1)) / bestAsk.ask - baseWithdrawalFee) *
                (-bestBid.cost + 1) -
                quoteWithdrawalFee -
                funds)) /
        funds;
    return percentage;
}

function getMinimunInversion(seed, bestAsk, bestBid) {
    let { baseCurrency, quoteCurrency } = getCurrencies(bestAsk);

    let baseWithdrawalFee = getWithdrawalFee(baseCurrency);
    let quoteWithdrawalFee = getWithdrawalFee(quoteCurrency);

    // this formula was generated using HP Prime Calculator solve function
    // P
    //p=(100 * (bid * ((x * (-fa + 1)) / ask - wfb) * (-fb + 1) - wfq - x)) / x;

    //solve(p=profit,x)
    /*
    {
        (-100 * ask * bid * fb * wfb + 100 * ask * bid * wfb + 100 * ask * wfq) /
            (100 * bid * fa * fb -
                ask * profit -
                100 * bid * fa -
                100 * bid * fb -
                100 * ask +
                100 * bid);
    }
    */

    let minQuote =
        (-100 * bestAsk.ask * bestBid.bid * bestBid.cost * baseWithdrawalFee +
            100 * bestAsk.ask * bestBid.bid * baseWithdrawalFee +
            100 * bestAsk.ask * quoteWithdrawalFee) /
        (100 * bestBid.bid * bestAsk.cost * bestBid.cost -
            bestAsk.ask * configs.minimumProfitInvest -
            100 * bestBid.bid * bestAsk.cost -
            100 * bestBid.bid * bestBid.cost -
            100 * bestAsk.ask +
            100 * bestBid.bid);

    let minBase = (minQuote / bestAsk.ask) * (1 - bestAsk.cost) - baseWithdrawalFee;

    return { minQuote, minBase };
}

function getFunds() {
    return 0.1;
}

function getCurrencies(price) {
    let coins = price.ticket.split("/");
    let baseCurrency = coins[0];
    let quoteCurrency = coins[1];
    return { baseCurrency, quoteCurrency };
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
                timeout: configs.apiTimeout * 1000
                //enableRateLimit: true
            });
        } else {
            _exchange = new ccxt[exchange]({
                timeout: configs.apiTimeout * 1000
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
