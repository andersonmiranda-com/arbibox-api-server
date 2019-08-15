"use strict";

var moment = require("moment");
var lodash = require("lodash");
var MongoClient = require("mongodb").MongoClient;
var url = "mongodb://localhost:27017/";
const configs = require("../config/settings");

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

exports.upsertOpportunity = function(data) {
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
        if (err) throw err;

        var db = client.db("arbibox");
        db.collection("opportunities").updateOne(
            { id: data.id },
            {
                $set: data,
                $addToSet: {
                    latest: {
                        created_at: data.created_at,
                        bid: data.sale.bid,
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

exports.removeOpportunity = function(data) {
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
        if (err) throw err;
        var db = client.db("arbibox");
        db.collection("opportunities").deleteMany({ id: data.id }, function(err, res) {
            if (err) throw err;
            //console.log(res.result);
            client.close();
        });
    });
};

exports.removeOpportunitiesByTicket = function(ticket) {
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
        if (err) throw err;
        var db = client.db("arbibox");
        db.collection("opportunities").deleteMany({ ticket: ticket }, function(err, res) {
            if (err) throw err;
            //console.log(res.result);
            client.close();
        });
    });
};

exports.removeOldOpportunitiesByTicket = function(ticket) {
    const minutesAgo = moment()
        .subtract(configs.removeAfterMinutes, "minutes")
        .toDate();
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
        if (err) throw err;
        var db = client.db("arbibox");
        db.collection("opportunities").deleteMany(
            { ticket: ticket, created_at: { $lt: minutesAgo } },
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

exports.saveArbitrages = function(id, data) {
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
        if (err) throw err;
        var db = client.db("arbibox");
        db.collection("arbitrages").updateOne(
            { id: id },
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
