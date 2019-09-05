"use strict";

var moment = require("moment");
var lodash = require("lodash");
var MongoClient = require("mongodb").MongoClient;
var url = "mongodb://localhost:27017/";

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
    return new Promise(async (resolve, reject) => {
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
                            created_at: data.opp_created_at,
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

exports.removeOpportunities = function(query) {
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
/// Triangular
///

exports.insertTriangularOpportunity = function(data) {
    return new Promise(async (resolve, reject) => {
        MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
            if (err) throw err;

            var db = client.db("arbibox");
            db.collection("-opportunities-triangular").insertOne(data, function(err, res) {
                if (err) throw err;
                //console.log(res.result);
                resolve(true);
                client.close();
            });
        });
    });
};

exports.readTriangularOpportunities = function(query) {
    return new Promise(async (resolve, reject) => {
        MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
            if (err) throw err;
            var db = client.db("arbibox");
            db.collection("opportunities-triangular")
                .find(query)
                .toArray(function(err, res) {
                    if (err) throw err;
                    resolve(res);
                    client.close();
                });
        });
    });
};

exports.upsertTriangularOpportunity = function(data) {
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
        if (err) throw err;
        // avoid update different _id
        var db = client.db("arbibox");
        db.collection("opportunities-triangular").updateOne(
            { id: data.id },
            {
                $set: data,
                $addToSet: {
                    lastest: {
                        created_at: data.created_at,
                        profit_percent: data.profit_percent
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

exports.updateTriangularOpportunity = function(data) {
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
        if (err) throw err;
        // avoid update different _id
        delete data._id;
        var db = client.db("arbibox");
        db.collection("opportunities-triangular").updateOne(
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

exports.removeTriangularOpportunity = function(query) {
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
        if (err) throw err;
        var db = client.db("arbibox");
        db.collection("opportunities-triangular").deleteMany(query, function(err, res) {
            if (err) throw err;
            //console.log(res.result);
            client.close();
        });
    });
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// Triangular
///

exports.insertTriangularCrossOpportunity = function(data) {
    return new Promise(async (resolve, reject) => {
        MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
            if (err) throw err;

            var db = client.db("arbibox");
            db.collection("triangular-cross").insertOne(data, function(err, res) {
                if (err) throw err;
                //console.log(res.result);
                resolve(true);
                client.close();
            });
        });
    });
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
///
/// Order Queue
///

exports.addToQueue = function(data) {
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
        if (err) throw err;
        var db = client.db("arbibox");
        db.collection("orders_queue").insertOne(data, function(err, res) {
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
