var moment = require("moment");
const lodash = require("lodash");

const colors = require("colors");
const util = require("util");

const db = require("../db");

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// Qualifies all parallel opportunities on "opportunites" mongoDB collection
///
const initialize = async function() {
    let orders = await db.readOrders({
        $and: [{ type: "TR" }]
    });

    for (let order of orders) {
        await calcMinInvest(order);
        //checkOpportunity(opportunity);
    }
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///

/*

ordersBook {
  '1': {
    symbol: 'XLM
    ',
    side: 'buy',
    ask: [ 0.00000643, 10 ],
    bid: [ 0.00000642, 3002.4 ]
  },
  '2': {
    symbol: 'XLM/USDT',
    side: 'sell',
    ask: [ 0.062206, 11.168 ],
    bid: [ 0.062078, 86.1517 ]
  },
  '3': {
    symbol: 'BTC/USDT',
    side: 'buy',
    ask: [ 9600.67, 0.0078 ],
    bid: [ 9594.62, 0.05 ]
  },
  cheched_at: 2019-09-01T06:13:37.414Z
}


ordersBook {
  '1': {
    symbol: 'BTC/USDT',
    side: 'sell',
    ask: [ 9630.38, 0.002 ],
    bid: [ 9626.04, 0.0124 ]
  },
  '2': {
    symbol: 'XLM/USDT',
    side: 'buy',
    ask: [ 0.06221, 625.4611 ],
    bid: [ 0.062127, 33.1853 ]
  },
  '3': {
    symbol: 'XLM
    ',
    side: 'sell',
    ask: [ 0.00000653, 4471.6 ],
    bid: [ 0.00000652, 0.41 ]
  },
  cheched_at: 2019-09-01T01:31:59.144Z
}

*/

///
///

function calcMinInvest(order) {
    // let order = {
    //     ordersBook: {
    //         "1": {
    //             symbol: "ETH",
    //             side: "buy",
    //             ask: [0.017797, 2.8347],
    //             bid: [0.01779, 1.5201212]
    //         },
    //         "2": {
    //             symbol: "MKR/ETH",
    //             side: "buy",
    //             ask: [2.7655, 0.0001],
    //             bid: [2.7628, 0.6155]
    //         },
    //         "3": {
    //             symbol: "MKR    ",
    //             side: "sell",
    //             ask: [0.04943, 0.0001],
    //             bid: [0.0494, 0.3795]
    //         }
    //     }
    // };

    let { ordersBook } = order;

    //console.log(colors.yellow("Q >> Calc Min Invest..."), order.id);
    //console.log(colors.yellow("Q >> ordersBook"), order.ordersBook);

    let investMax1 = 0;
    let multiplier1 = 0;
    if (ordersBook["1"].side === "sell") {
        investMax1 = ordersBook["1"].bid[1];
        multiplier1 = 1 / ordersBook["1"].bid[0];
    } else {
        investMax1 = ordersBook["1"].ask[1] * ordersBook["1"].ask[0];
        multiplier1 = ordersBook["1"].ask[0];
    }

    let investMax3 = 0;
    let multiplier3 = 0;

    if (ordersBook["3"].side === "buy") {
        investMax3 = ordersBook["3"].ask[1];
        multiplier3 = 1 / ordersBook["3"].ask[0];
    } else {
        investMax3 = ordersBook["3"].bid[1] * ordersBook["3"].bid[0];
        multiplier3 = ordersBook["3"].bid[0];
    }

    let investMax2 = 0;
    if (ordersBook["2"].side === "buy") {
        investMax2 = ordersBook["2"].ask[1] * ordersBook["2"].ask[0] * multiplier1;
    } else {
        investMax2 = ordersBook["2"].bid[1] * ordersBook["2"].bid[0] * multiplier3;
    }

    let maxInvest = lodash.min([investMax1, investMax2, investMax3]);

    //console.log(
    //    order.id,
    //    maxInvest,
    //    order.chain.symbols[0].limits.amount.min,
    //);
    if (maxInvest >= order.chain.symbols[0].limits.amount.min) {
        console.log(order.id, "approved", maxInvest);
    }
}

const getAmountPrice = transaction => {
    let price = 0;
    let amount = 0;

    if (transaction.side === "buy") {
        price = transaction.ask[0];
        amount = transaction.ask[1];
    } else if (transaction.side === "sell") {
        price = 1 / transaction.bid[0];
        amount = transaction.bid[1];
    }
    return { amount, price };
};

initialize();
