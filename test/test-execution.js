const ccxt = require("ccxt");
const moment = require("moment");
const lodash = require("lodash");

const { configs } = require("../core/arbitrage/settings");
const colors = require("colors");

const { createOrder, fetchBalance, fetchOrder } = require("../core/exchange");
const db = require("../core/db");

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
    opp_created_at: new Date("2019-09-05T10:18:32.856Z")
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// Executes
///

const initialize = async function(opportunity) {
    //console.log(colors.green("E >> Executing..."), colors.cyan(opportunity.id));
    prepareOrder(opportunity);
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// Prepare Order To be executed
///

const prepareOrder = async opportunity => {
    //executeOrder(opportunity);

    /////////////////////////////////////////////////////////
    //
    // get Wallets Balances
    //

    let buyWallets = await fetchBalance(opportunity.buy_at);
    let sellWallets = await fetchBalance(opportunity.sell_at);

    opportunity.wallets = {
        buy: {
            exchange: opportunity.buy_at,
            [opportunity.base]: buyWallets[opportunity.base] || 0,
            [opportunity.quote]: buyWallets[opportunity.quote] || 0
        },
        sell: {
            exchange: opportunity.sell_at,
            [opportunity.base]: sellWallets[opportunity.base] || 0,
            [opportunity.quote]: sellWallets[opportunity.quote] || 0
        }
    };

    /////////////////////////////////////////////////////////
    //
    // Check funds
    //

    let buyAmount = lodash.min([
        opportunity.wallets.buy[opportunity.quote] / opportunity.bestAsk.ask,
        opportunity.wallets.sell[opportunity.base],
        opportunity.invest.max.base
    ]);

    if (buyAmount < opportunity.invest.min.base) {
        insuficientFunds = true;
        opportunity.approved = false;
        console.log(colors.red("E >>"), "Insuficient funds");

        if (
            opportunity.wallets.buy[opportunity.quote] / opportunity.bestAsk.ask <
            opportunity.invest.min.base
        ) {
            opportunity.wallets.buy.status = "Insuficient";
        }

        if (opportunity.wallets.sell[opportunity.base] < opportunity.invest.min.base) {
            opportunity.wallets.sell.status = "Insuficient";
        }

        opportunity.quality.execution_note = "Insuficient Funds";
        db.updateOpportunity(opportunity);
        return;

        //prepare to withdraw
    }

    //let sellBalance = buyAmount - opportunity.bestAsk.baseWithdrawalFee;
    let sellBalance = buyAmount;
    let sellAmount = sellBalance / (1 + opportunity.bestBid.tradeFee);

    /////////////////////////////////////////////////////////
    //
    // buy & sell order data
    //

    opportunity.buyOrderData = {
        exchange: opportunity.buy_at,
        side: "buy",
        type: "limit",
        symbol: opportunity.symbol,
        amount: buyAmount,
        price: opportunity.bestAsk.ask
    };

    opportunity.sellOrderData = {
        exchange: opportunity.sell_at,
        side: "sell",
        type: "limit",
        symbol: opportunity.symbol,
        amount: sellAmount,
        price: opportunity.bestBid.bid
    };

    db.updateOpportunity(opportunity);
    !configs.simulationMode && executeOrder(opportunity);
    // check limits
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// Prepara Order To be executed
///

const executeOrder = async opportunity => {
    console.log(colors.green("E >> Executing..."), colors.cyan(opportunity.id));

    let { buyOrderData, sellOrderData } = opportunity;
    let buyOrderResult = await createOrder(buyOrderData);
    db.addOrder({
        created_at: moment().toDate(),
        opportunity_id: opportunity._id,
        exchange: buyOrderData.exchange,
        side: buyOrderData.side,
        type: buyOrderData.type,
        symbol: buyOrderData.symbol,
        amount: buyOrderData.amount,
        price: buyOrderData.price,
        status: buyOrderResult.status,
        orderResult: buyOrderResult
    });

    console.log(
        colors.green("E >> Buy order created..."),
        colors.cyan(buyOrderData.exchange),
        buyOrderData.symbol,
        buyOrderData.amount
    );

    ////////////////////////
    //execute sell order

    let sellOrderResult = await createOrder(sellOrderData);
    db.addOrder({
        created_at: moment().toDate(),
        opportunity_id: opportunity._id,
        exchange: sellOrderData.exchange,
        side: sellOrderData.side,
        type: sellOrderData.type,
        symbol: sellOrderData.symbol,
        amount: sellOrderData.amount,
        price: sellOrderData.price,
        status: sellOrderResult.status,
        orderResult: sellOrderResult
    });

    console.log(
        colors.green("E >> Sell order created..."),
        colors.cyan(sellOrderData.exchange),
        sellOrderData.symbol,
        sellOrderData.amount
    );

    //

    /////////////////////////////////////////////////////////
    //
    // buy order data
    //

    // //let buyWdAddress = fetchDepositAddress(opportunity.buy_at, opportunity.quote);
    // let buyWdAddress = {
    //     currency: opportunity.quote,
    //     address: "abc",
    //     tag: "tag",
    //     info: "info"
    // };

    // /////////////////////////////////////////////////////////
    // //
    // // buy order data
    // //

    // //let sellWdAddress = fetchDepositAddress(opportunity.sell_at, opportunity.base);
    // let sellWdAddress = {
    //     currency: opportunity.base,
    //     address: "def",
    //     tag: "tag",
    //     info: "info"
    // };

    // //withdrawal from buy side
    // let buyWdData = {
    //     exchange: opportunity.buy_at,
    //     code: opportunity.base,
    //     amount: buyWdAmount,
    //     address: sellWdAddress
    // };

    // //withdrawal from buy side
    // let sellWdData = {
    //     exchange: opportunity.sell_at,
    //     code: opportunity.quote,
    //     amount: sellWdAmount,
    //     address: buyWdAddress
    // };

    //console.log(colors.green("E >> Executing..."), order);
};

const checkOrders = async function() {
    ////////
    // create a queue with open orders status
    ////////
    let openOrders = await db.readOrders({
        $or: [{ status: "open" }, { status: { $exists: false } }]
    });
    if (openOrders.length === 0) return false;

    console.log("E >> Checking Orders status");

    let promises = openOrders.map(async order => Promise.resolve(await callCheckOrder(order)));

    Promise.all(promises).then(response => {
        console.log("E >> Orders checked");
    });
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// Delays execution 300ms to avoid reject Access Denied (Too many requests)
///

function callCheckOrder(order) {
    return new Promise((resolve, reject) => {
        setTimeout(function() {
            //console.log("run", signal.id);
            checkOrder(order);
            resolve(true);
        }, 2000);
    });
}

const checkOrder = async function(order) {
    console.log(order.exchange, order.side, order.amount);
    await loadExchange(order.exchange);
    let orderResult = await fetchOrder(order.exchange, order.orderResult.id, order.symbol);
    if (orderResult.id) {
        order.orderResult = orderResult;
        order.status = orderResult.status;
    }
    db.updateOrder(order);
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

const loadExchange = async name => {
    global.api = {};
    var _instance;

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
};

module.exports = {
    initialize,
    executeOrder
};

checkOrders();
