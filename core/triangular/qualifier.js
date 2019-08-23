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
        .subtract(configs.triangular.quality.removeAfterMinutesOff, "minutes")
        .toDate();

    db.removeOpportunities({ $and: [{ created_at: { $lt: minutesAgo } }, { type: "TR" }] });

    ////////
    // remove poportunities with more than X iterractions and approved = false
    ////////
    db.removeOpportunities({
        $and: [
            // { approved: false },
            { type: "TR" },
            { $where: "this.lastest.length >= " + configs.triangular.quality.removeAfterIterations }
        ]
    });

    let opportunities = await db.readOpportunities({
        $and: [{ type: "TR", qualified: { $exists: false } }]
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
    let promises = [opportunity.symbol1, opportunity.symbol2, opportunity.symbol3].map(
        async symbol => Promise.resolve(fetchTrades(opportunity.exchange, symbol))
    );

    Promise.all(promises).then(response => {
        //console.log(opportunity);
        //console.log(response);
        //console.log(opportunity.symbol);

        let quality = {};
        opportunity.approved = false;

        console.log("");

        console.log(colors.yellow("Q >> "), opportunity.id);

        let symbolsOk = 0;

        for (let excTrade of response) {
            //console.log(excTrade);
            if (excTrade.trades && excTrade.trades.length >= 0) {
                if (excTrade.trades.length !== 0) {
                    quality[excTrade.symbol] = true;
                    console.log("Q >> ", excTrade.id, excTrade.symbol, colors.green("active"));
                    symbolsOk++;
                } else {
                    quality[excTrade.symbol] = false;
                    console.log("Q >> ", excTrade.id, excTrade.symbol, colors.magenta("inactive"));
                }
            } else {
                quality = false;
                console.log("Q >> ", excTrade.id, colors.red("inactive"));
            }
        }

        opportunity.qualified = true;
        opportunity.approved = symbolsOk === 3 ? true : false;
        opportunity.quality = quality;
        db.updateOpportunity(opportunity);

        if (opportunity.approved) {
            console.log(colors.green("Q >>"), colors.green(opportunity.id));
        } else {
            console.log(colors.red("Q >>"), colors.red(opportunity.id));
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
        symbol: symbol,
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

        let since =
            _exchange.milliseconds() - configs.triangular.quality.lastTradeTimeLimit * 60 * 1000; //
        let limit = 1;
        exchangeInfo.trades = await _exchange.fetchTrades(symbol, since, limit);

        //tickets.map(ticket => verbose && console.log(ticket));
    } catch (error) {
        console.error(colors.red("Q >> Error fetchTrades:"), error.message);
        return exchangeInfo;
    } finally {
        return exchangeInfo;
    }
}

module.exports = {
    initialize
};
