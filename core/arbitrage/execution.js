var moment = require("moment");
const configs = require("../../config/settings-arbitrage");
const colors = require("colors");

const db = require("../db");

let opportunity_test = {
    _id: "5d70e0f8bffb892ee2e9e740",
    id: "etc/eth-binance-kraken",
    opp_created_at: new Date("2019-09-05T10:18:22.917Z"),
    type: "PA",
    symbol: "ETC/ETH",
    buy_at: "binance",
    sell_at: "kraken",
    profit_percent: 0.849181954999907,
    bestAsk: {
        bid: 0.040697,
        ask: 0.040791,
        baseVolume: 34838.03,
        quoteVolume: 1397.20583903,
        name: "binance",
        symbol: "ETC/ETH",
        tradeFee: 0.001,
        quoteWithdrawalFee: 0.01,
        baseWithdrawalFee: 0.01
    },
    bestBid: {
        bid: 0.041608,
        ask: 0.042049,
        baseVolume: 429.53092574,
        quoteVolume: 17.5345605784952,
        name: "kraken",
        symbol: "ETC/ETH",
        tradeFee: 0.0026,
        quoteWithdrawalFee: 0.005
    },
    base: "ETC",
    quote: "ETH",
    invest: {
        min: {
            base: 8.61044608478991,
            quote: 0.351979975774355,
            profit_percent: 0.1,
            profit: 0.000351979975774355
        },
        max: {
            base: 16.82,
            quote: 0.6860878,
            profit_percent: 0.849181954999907,
            profit: 0.00582613379305585
        }
    },
    qualified: true,
    ordersBook: {
        cheched_at: new Date("2019-09-05T10:18:32.856Z"),
        buy: {
            exchange: "binance",
            ask1: [0.04079, 54.57],
            ask2: [0.040791, 2.4]
        },
        sell: {
            exchange: "kraken",
            bid1: [0.041608, 16.82],
            bid2: [0.041483, 61.926]
        }
    },
    approved: true,
    quality: {
        note: "row1",
        checked_at: new Date("2019-09-05T10:18:32.856Z"),
        score: 5
    },
    ord_created_at: new Date("2019-09-05T10:18:32.856Z")
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// Qualifies all parallel opportunities on "opportunites" mongoDB collection
///

const initialize = async function(opportunity) {
    console.log(colors.green("E >> Executing..."), colors.cyan(opportunity.id));
    prepareOrder(opportunity);
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// Prepara Order To be executed
///

const prepareOrder = opportunity => {
    // remove from opportunities
    //db.removeOpportunities({ id: order.id });
    delete opportunity._id;
    opportunity.ord_created_at = moment().toDate();
    // add to orders collection
    db.addToQueue(opportunity);
    console.log(colors.green("E >> Created..."), colors.cyan(opportunity.id));
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// Prepara Order To be executed
///

const executeOrder = opportunity => {
    // remove from opportunities

    let buy_amount = opportunity.invest.max.quote / opportunity.bestAsk.ask;
    let buy_balance = buy_amount * (1 + opportunity.bestAsk.tradeFee);
    let buy_wd = buy_amount;

    let buy_order = {
        exchange: opportunity.buy_at,
        side: "buy",
        type: "market",
        symbol: opportunity.symbol,
        amount: buy_amount
    };

    let sell_balance = buy_amount - opportunity.bestAsk.baseWithdrawalFee;
    let sell_amount = sell_balance / (1 + opportunity.bestbid.tradeFee);
    let sell_wd = sell_amount * opportunity.bestbid.bid;

    let sell_order = {
        exchange: opportunity.sell_at,
        side: "sell",
        type: "market",
        symbol: opportunity.symbol,
        amount: sell_amount
    };

    //

    //let buy_wd_address = fetchDepositAddress(opportunity.buy_at, opportunity.quote);
    let buy_wd_address = {
        currency: opportunity.quote,
        address: "abc",
        tag: "tag",
        info: "info"
    };

    //let sell_wd_address = fetchDepositAddress(opportunity.sell_at, opportunity.base);
    let sell_wd_address = {
        currency: opportunity.base,
        address: "def",
        tag: "tag",
        info: "info"
    };

    //withdrawal from buy side
    let buy_wd = {
        exchange: opportunity.buy_at,
        code: sell_wd_code,
        address: sell_wd_address.address,
        symbol: opportunity.symbol,
        amount: buy_wd
    };

    //withdrawal from buy side
    let sell_wd = {
        exchange: opportunity.sell_at,
        side: "sell",
        type: "market",
        symbol: opportunity.symbol,
        amount: sell_wd
    };

    console.log(colors.green("E >> Executing..."), order);
};

module.exports = {
    initialize
};

executeOrder(opportunity_test);
