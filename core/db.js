"use strict";

const moment = require("moment");
const lodash = require("lodash");
const MongoClient = require("mongodb").MongoClient;
const ObjectID = require("mongodb").ObjectID;
const url = "mongodb://localhost:27017/";

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
/// Signal
///

exports.createSignal = function(data) {
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
        if (err) throw err;
        var db = client.db("arbibox");
        db.collection("signals").insertOne(data, function(err, res) {
            if (err) throw err;
            //console.log(res.result);
            client.close();
        });
    });
};

exports.readSignals = function(query) {
    return new Promise(async (resolve, reject) => {
        MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
            if (err) throw err;
            var db = client.db("arbibox");
            db.collection("signals")
                .find(query)
                .toArray(function(err, res) {
                    if (err) throw err;
                    resolve(res);
                    client.close();
                });
        });
    });
};

exports.upsertSignal = function(data) {
    return new Promise(async (resolve, reject) => {
        MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
            if (err) throw err;
            // avoid update different _id
            var db = client.db("arbibox");
            db.collection("signals").updateOne(
                { code: data.code },
                {
                    $set: data,
                    $addToSet: {
                        lastest: {
                            signal_created_at: data.signal_created_at,
                            profit_percent: data.profit_percent
                        }
                    }
                },
                { upsert: true },
                function(err, res) {
                    if (err) throw err;
                    //console.log(res.result);
                    client.close();
                    resolve(true);
                }
            );
        });
    });
};

exports.updateSignal = function(data) {
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
        if (err) throw err;
        // avoid update different _id
        delete data._id;
        var db = client.db("arbibox");
        db.collection("signals").updateOne(
            { code: data.code },
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

exports.removeSignals = function(query) {
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
        if (err) throw err;
        var db = client.db("arbibox");
        db.collection("signals").deleteMany(query, function(err, res) {
            if (err) throw err;
            //console.log(res.result);
            client.close();
        });
    });
};

exports.removeAllSignals = function() {
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
        if (err) throw err;
        var db = client.db("arbibox");
        db.collection("signals").deleteMany({}, function(err, res) {
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

exports.saveWallet = function(data) {
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
        if (err) throw err;
        var db = client.db("arbibox");
        db.collection("wallets").updateOne(
            { id: data.id },
            { $set: data },
            { upsert: true },
            function(err, res) {
                if (err) throw err;
                //console.log(res.result);
                client.close();
            }
        );
    });
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// Withdrawals Fees
///

exports.getWithdrawalFees = function() {
    return new Promise(async (resolve, reject) => {
        MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
            if (err) throw err;
            var db = client.db("arbibox");
            db.collection("fees")
                .find({})
                .toArray(function(err, res) {
                    if (err) throw err;
                    //console.log(res.result);
                    resolve(res);
                    client.close();
                });
        });
    });
};

exports.upsertFees = function(data) {
    return new Promise(async (resolve, reject) => {
        MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
            if (err) throw err;
            // avoid update different _id
            var db = client.db("arbibox");
            db.collection("fees").updateOne(
                { exchange: data.exchange },
                { $set: data },
                { upsert: true },
                function(err, res) {
                    if (err) throw err;
                    //console.log(res.result);
                    client.close();
                    resolve(true);
                }
            );
        });
    });
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// Opportunity
///

exports.addOpportunity = function(data) {
    return new Promise(async (resolve, reject) => {
        MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
            if (err) throw err;
            var db = client.db("arbibox");
            db.collection("opportunities").insertOne(data, function(err, res) {
                if (err) throw err;
                resolve(res.insertedId);
                client.close();
            });
        });
    });
};

exports.updateOpportunity = function(data) {
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
        if (err) throw err;
        // avoid update different _id
        var db = client.db("arbibox");
        db.collection("opportunities").updateOne(
            { _id: data._id },
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

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// Lost Opportunities
///

exports.addLostOpportunity = function(data) {
    return new Promise(async (resolve, reject) => {
        MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
            if (err) throw err;
            var db = client.db("arbibox");
            db.collection("lost_opportunities").insertOne(data, function(err, res) {
                if (err) throw err;
                resolve(res.insertedId);
                client.close();
            });
        });
    });
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// Orders
///

exports.addOrder = function(data) {
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

exports.readOrders = function(query) {
    return new Promise(async (resolve, reject) => {
        MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
            if (err) throw err;
            var db = client.db("arbibox");
            db.collection("orders")
                .find(query)
                .toArray(function(err, res) {
                    if (err) throw err;
                    resolve(res);
                    client.close();
                });
        });
    });
};

exports.updateOrder = function(data) {
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
        if (err) throw err;
        // avoid update different _id
        var db = client.db("arbibox");
        db.collection("orders").updateOne({ _id: data._id }, { $set: data }, function(err, res) {
            if (err) throw err;
            //console.log(res.result);
            client.close();
        });
    });
};
