const ccxt = require("ccxt");
var moment = require("moment");
const configs = require("../../config/settings-arbitrage");
const colors = require("colors");

const { createOrder } = require("../exchange");
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
        bid: 0.040674,
        ask: 0.040705,
        baseVolume: 34838.03,
        quoteVolume: 1397.20583903,
        name: "binance",
        symbol: "ETC/ETH",
        tradeFee: 0.001,
        quoteWithdrawalFee: 0.01,
        baseWithdrawalFee: 0.01
    },
    bestBid: {
        bid: 0.041334,
        ask: 0.041844,
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

const executeOrder = async opportunity => {
    /////////////////////////////////////////////////////////
    //
    // get Wallets Balances
    //

    // check limits

    /////////////////////////////////////////////////////////
    //
    // buy order data
    //

    //let investQuote = opportunity.invest.min.quote;
    let investQuote = 0.3;

    let buyAmount = investQuote / opportunity.bestAsk.ask;
    let buyBalance = buyAmount * (1 + opportunity.bestAsk.tradeFee);

    ////check Balance
    let buyWdAmount = buyAmount;

    let buyOrderData = {
        exchange: opportunity.buy_at,
        side: "buy",
        type: "market",
        symbol: opportunity.symbol,
        amount: buyAmount,
        price: opportunity.bestAsk.ask
    };

    /////////////////////////////////////////////////////////
    //
    // sell order data
    //

    let sellBalance = buyAmount - opportunity.bestAsk.baseWithdrawalFee;
    let sellAmount = sellBalance / (1 + opportunity.bestBid.tradeFee);
    let sellWdAmount = sellAmount * opportunity.bestBid.bid;

    let sellOrderData = {
        exchange: opportunity.sell_at,
        side: "sell",
        type: "market",
        symbol: opportunity.symbol,
        amount: sellAmount,
        price: opportunity.bestBid.bid
    };

    ////////////////////////
    // Check

    ////////////////////////
    //execute buy order

    //buyOrderResult = {};
    //sellOrderResult = {};

    let buyOrderResult = await createOrder(buyOrderData);
    db.addOrder({ opp_id: opportunity._id, buyOrderData, buyOrderResult });

    ////////////////////////
    //execute sell order

    let sellOrderResult = await createOrder(sellOrderData);
    db.addOrder({ opp_id: opportunity._id, sellOrderData, sellOrderResult });

    //

    /////////////////////////////////////////////////////////
    //
    // buy order data
    //

    //let buyWdAddress = fetchDepositAddress(opportunity.buy_at, opportunity.quote);
    let buyWdAddress = {
        currency: opportunity.quote,
        address: "abc",
        tag: "tag",
        info: "info"
    };

    /////////////////////////////////////////////////////////
    //
    // buy order data
    //

    //let sellWdAddress = fetchDepositAddress(opportunity.sell_at, opportunity.base);
    let sellWdAddress = {
        currency: opportunity.base,
        address: "def",
        tag: "tag",
        info: "info"
    };

    //withdrawal from buy side
    let buyWdData = {
        exchange: opportunity.buy_at,
        code: opportunity.base,
        amount: buyWdAmount,
        address: sellWdAddress
    };

    //withdrawal from buy side
    let sellWdData = {
        exchange: opportunity.sell_at,
        code: opportunity.quote,
        amount: sellWdAmount,
        address: buyWdAddress
    };

    //console.log(colors.green("E >> Executing..."), order);
};

const testOrder = async opportunity => {
    global.api = {};
    var _instance;

    let name = "binance";

    if (configs.keys[name]) {
        _instance = new ccxt[name]({
            apiKey: configs.keys[name].apiKey,
            secret: configs.keys[name].secret,
            timeout: configs.apiTimeout * 1000,
            enableRateLimit: true
        });
    }

    await _instance.loadMarkets();

    api[name] = _instance;

    name = "kraken";

    if (configs.keys[name]) {
        _instance = new ccxt[name]({
            apiKey: configs.keys[name].apiKey,
            secret: configs.keys[name].secret,
            timeout: configs.apiTimeout * 1000,
            enableRateLimit: true
        });
    }

    await _instance.loadMarkets();

    api[name] = _instance;

    executeOrder(opportunity);
};

module.exports = {
    initialize
};

testOrder(opportunity_test);
