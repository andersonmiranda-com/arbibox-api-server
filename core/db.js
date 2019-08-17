"use strict";

var moment = require("moment");
var lodash = require("lodash");
var MongoClient = require("mongodb").MongoClient;
var url = "mongodb://localhost:27017/";
const configs = require("../config/settings");

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// Exchanges
///

exports.saveExchange = function(id, data) {
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
        if (err) throw err;
        var db = client.db("arbibox");
        db.collection("exchanges").updateOne({ id: id }, { $set: data }, { upsert: true }, function(
            err,
            res
        ) {
            if (err) throw err;
            //console.log(res.result);
            client.close();
        });
    });
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// Opportunities
///

exports.createOpportunity = function(data) {
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
        if (err) throw err;
        var db = client.db("arbibox");
        db.collection("opportunities").insertOne(data, function(err, res) {
            if (err) throw err;
            //console.log(res.result);
            client.close();
        });
    });
};

exports.readOpportunities = function(query) {
    return new Promise(async (resolve, reject) => {
        MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
            if (err) throw err;
            var db = client.db("arbibox");
            db.collection("opportunities")
                .find(query)
                .toArray(function(err, res) {
                    if (err) throw err;
                    resolve(res);
                    client.close();
                });
        });
    });
};

exports.upsertOpportunity = function(data) {
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
        if (err) throw err;
        // avoid update different _id
        var db = client.db("arbibox");
        db.collection("opportunities").updateOne(
            { id: data.id },
            {
                $set: data,
                $addToSet: {
                    lastest: {
                        created_at: data.created_at,
                        bid: data.sell.bid,
                        ask: data.buy.ask,
                        gain: data.profit1
                    }
                }
            },
            { upsert: true },
            function(err, res) {
                if (err) throw err;
                //console.log(res.result);
                client.close();
            }
        );
    });
};

exports.updateOpportunity = function(data) {
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
        if (err) throw err;
        // avoid update different _id
        delete data._id;
        var db = client.db("arbibox");
        db.collection("opportunities").updateOne(
            { id: data.id },
            {
                $set: data
            },
            function(err, res) {
                if (err) throw err;
                //console.log(res.result);
                client.close();
            }
        );
    });
};

exports.removeOpportunity = function(query) {
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
        if (err) throw err;
        var db = client.db("arbibox");
        db.collection("opportunities").deleteMany(query, function(err, res) {
            if (err) throw err;
            //console.log(res.result);
            client.close();
        });
    });
};

exports.removeOpportunitiesBySymbol = function(symbol) {
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
        if (err) throw err;
        var db = client.db("arbibox");
        db.collection("opportunities").deleteMany({ symbol: symbol }, function(err, res) {
            if (err) throw err;
            //console.log(res.result);
            client.close();
        });
    });
};

exports.removeOldOpportunitiesBySymbol = function(symbol) {
    const minutesAgo = moment()
        .subtract(configs.removeAfterMinutes, "minutes")
        .toDate();
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
        if (err) throw err;
        var db = client.db("arbibox");
        db.collection("opportunities").deleteMany(
            { symbol: symbol, created_at: { $lt: minutesAgo } },
            function(err, res) {
                if (err) throw err;
                //console.log(res.result);
                client.close();
            }
        );
    });
};

exports.removeAllOpportunities = function() {
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
        if (err) throw err;
        var db = client.db("arbibox");
        db.collection("opportunities").deleteMany({}, function(err, res) {
            if (err) throw err;
            //console.log(res.result);
            client.close();
        });
    });
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// Tickets
///

exports.saveTickets = function(id, data) {
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
        if (err) throw err;
        var db = client.db("arbibox");
        db.collection("tickets").updateOne({ id: id }, { $set: data }, { upsert: true }, function(
            err,
            res
        ) {
            if (err) throw err;
            //console.log(res.result);
            client.close();
        });
    });
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// Wallets
///

exports.saveWallets = function(id, data) {
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
        if (err) throw err;
        var db = client.db("arbibox");
        db.collection("wallets").updateOne({ id: id }, { $set: data }, { upsert: true }, function(
            err,
            res
        ) {
            if (err) throw err;
            //console.log(res.result);
            client.close();
        });
    });
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// Withdrawals Fees
///

exports.getWithdrawalFees = function(cb) {
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
        if (err) throw err;
        var db = client.db("arbibox");
        db.collection("fees")
            .find({})
            .sort({ coin: 1 })
            .toArray(function(err, res) {
                if (err) throw err;
                //console.log(res.result);
                client.close();
                cb(res);
            });
    });
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// Triangular
///

exports.insertTriangularOpportunity = function(data) {
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
        if (err) throw err;

        var db = client.db("arbibox");
        db.collection("triangular").insertOne(data, function(err, res) {
            if (err) throw err;
            //console.log(res.result);
            client.close();
        });
    });
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// Orders
///

exports.createOrder = function(data) {
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
        if (err) throw err;
        var db = client.db("arbibox");
        db.collection("orders").insertOne(data, function(err, res) {
            if (err) throw err;
            //console.log(res.result);
            client.close();
        });
    });
};
