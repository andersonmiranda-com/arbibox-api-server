const ccxt = require("ccxt");
const moment = require("moment");
const lodash = require("lodash");

const { configs } = require("./settings");
const colors = require("colors");

const { createOrder, fetchBalance, fetchOrder } = require("../exchange");
const db = require("../db");

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

    //TODO: check if there is an open order for this opportunity
    //        opportunity.status = "cancel";

    let buyAmount = lodash.min([
        opportunity.wallets.buy[opportunity.quote] / opportunity.bestAsk.ask,
        opportunity.wallets.sell[opportunity.base],
        opportunity.invest.max.base
    ]);

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

    executeOrder(opportunity);
    // check limits
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// Prepara Order To be executed
///

const executeOrder = async opportunity => {
    console.log(colors.green("E >>"), "Executing...", colors.cyan(opportunity.code));

    let { buyOrderData, sellOrderData } = opportunity;

    let buyOrderResult = await createOrder(buyOrderData);

    db.addOrder({
        created_at: moment().toDate(),
        opportunity_id: opportunity._id,
        code: opportunity.code,
        exchange: buyOrderData.exchange,
        side: buyOrderData.side,
        type: buyOrderData.type,
        symbol: buyOrderData.symbol,
        amount: buyOrderData.amount.toFixed(8),
        price: buyOrderData.price.toFixed(8),
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
        code: opportunity.code,
        exchange: sellOrderData.exchange,
        side: sellOrderData.side,
        type: sellOrderData.type,
        symbol: sellOrderData.symbol,
        amount: sellOrderData.amount.toFixed(8),
        price: sellOrderData.price.toFixed(8),
        status: sellOrderResult.status,
        orderResult: sellOrderResult
    });

    opportunity.status = "open";
    db.updateOpportunity(opportunity);

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

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// Check Orders
///

const checkOrders = async function() {
    ////////
    // create a queue with open orders status
    ////////
    let openOrders = await db.readOrders({
        $or: [{ status: "open" }, { status: { $exists: false } }]
    });
    if (openOrders.length === 0) return false;

    //console.log("E >> Checking Orders status");

    let promises = openOrders.map(async order => Promise.resolve(await checkOrder(order)));

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
    //console.log(order.exchange, order.side, order.amount);
    if (!order.orderResult.id) {
        order.status = "error";
        await db.updateOrder(order);
        return;
    }
    let orderResult = await fetchOrder(order.exchange, order.orderResult.id, order.symbol);

    //TODO: update opportunity status as completed

    if (orderResult.id) {
        order.orderResult = orderResult;
        order.status = orderResult.status;
        await db.updateOrder(order);
    }
};

module.exports = {
    initialize,
    executeOrder,
    checkOrders
};

//checkOrders();
