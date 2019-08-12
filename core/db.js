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
                        bid: data.bid,
                        ask: data.ask,
                        gain: data.gain
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
        .subtract(configs.remove_after_minutes, "minutes")
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
