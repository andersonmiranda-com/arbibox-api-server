const ccxt = require("ccxt");
var moment = require("moment");
const lodash = require("lodash");
const configs = require("../../config/settings");
const colors = require("colors");
const util = require("util");

const db = require("../db");

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// Qualifies all parallel opportunities on "opportunites" mongoDB collection
///
const initialize = async function() {
    ////////
    // remove opportunities created some time ago - wich does not have upadates
    ////////
    const minutesAgo = moment()
        .subtract(configs.quality.removeAfterMinutesOff, "minutes")
        .toDate();

    db.removeOpportunity({ created_at: { $lt: minutesAgo } });

    ////////
    // remove poportunities with more than X iterractions and approved = false
    ////////
    db.removeOpportunity({
        $and: [
            // { approved: false },
            { $where: "this.lastest.length >= " + configs.quality.removeAfterIterations }
        ]
    });

    let opportunities = await db.readOpportunities({
        $and: [{ type: "AP", qualified: { $exists: false } }]
    });

    for (let opportunity of opportunities) {
        await callCheck(opportunity);
        //checkOpportunity(opportunity);
    }
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// Delays execution 300ms to avoid reject Access Denied (Too many requests)
///

function callCheck(opportunity) {
    return new Promise((resolve, reject) => {
        setTimeout(function() {
            //console.log("run", opportunity.id);
            checkOpportunity(opportunity);
            resolve(true);
        }, 500);
    });
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
///
///

async function checkOpportunity(opportunity) {
    let promises = [opportunity.buy_at, opportunity.sell_at].map(async exchange =>
        Promise.resolve(fetchTrades(exchange, opportunity.symbol))
    );

    Promise.all(promises).then(response => {
        //console.log(opportunity);
        //console.log(response);
        //console.log(opportunity.symbol);

        let quality = { buy: false, sell: false };
        opportunity.approved = false;

        console.log("");

        console.log(colors.yellow(">>>> "), opportunity.symbol);

        for (let excTrade of response) {
            //console.log(excTrade);

            if (excTrade.trades.length) {
                if (excTrade.id === opportunity.buy_at) {
                    let trades = excTrade.trades.find(trade => trade.side === "buy");
                    if (trades && trades.length !== 0) {
                        quality.buy = true;
                        console.log(excTrade.id, colors.cyan("buy"), excTrade.trades[0].datetime);
                    } else {
                        quality.buy = false;
                        console.log(excTrade.id, colors.magenta("no buy"));
                    }
                }

                if (excTrade.id === opportunity.sell_at) {
                    let trades = excTrade.trades.find(trade => trade.side === "sell");
                    if (trades && trades.length !== 0) {
                        quality.sell = true;
                        console.log(excTrade.id, colors.cyan("sell"), excTrade.trades[0].datetime);
                    } else {
                        quality.sell = false;
                        console.log(excTrade.id, colors.magenta("no sell"));
                    }
                }
            } else {
                console.log(excTrade.id, colors.red("inactive"));
            }
        }

        opportunity.qualified = true;
        opportunity.approved = quality.sell && quality.buy;
        opportunity.quality = quality;
        db.updateOpportunity(opportunity);

        if (opportunity.approved) {
            console.log(colors.green(">>>> "), colors.green(opportunity.id));
        }
        // })
        // .catch(error => {
        //     console.error(colors.red("Error2:"), error.message);
    });
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
///
///

async function fetchTrades(exchange, symbol) {
    var exchangeInfo = {
        id: exchange,
        trades: [],
        wallets: []
    };

    try {
        var _exchange;

        if (configs.keys[exchange]) {
            _exchange = new ccxt[exchange]({
                apiKey: configs.keys[exchange].apiKey,
                secret: configs.keys[exchange].secret,
                timeout: configs.apiTimeout * 1000,
                enableRateLimit: true,
                nonce: function() {
                    return this.milliseconds();
                }
            });
            // exchangeInfo.wallets = await _exchange.fetchBalance();
            // db.saveWallets(exchangeTickets.id, {
            //     id: exchangeTickets.id,
            //     free: exchangeTickets.wallets.free,
            //     total: exchangeTickets.wallets.total
            // });
        } else {
            _exchange = new ccxt[exchange]({
                timeout: configs.apiTimeout * 1000,
                enableRateLimit: true,
                nonce: function() {
                    return this.milliseconds();
                }
            });
            exchangeInfo.wallets = [];
        }

        let since = _exchange.milliseconds() - configs.quality.lastTradeTimeLimit * 60 * 1000; //
        let limit = 1;
        exchangeInfo.trades = await _exchange.fetchTrades(symbol, since, limit);

        //tickets.map(ticket => verbose && console.log(ticket));
    } catch (error) {
        console.error(colors.red("Error fetchTrades:"), error.message);
        return exchangeInfo;
    } finally {
        return exchangeInfo;
    }
}

module.exports = {
    initialize
};
