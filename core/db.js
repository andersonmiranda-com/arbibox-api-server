"use strict";

var MongoClient = require("mongodb").MongoClient;
var url = "mongodb://localhost:27017/";
const lodash = require("lodash");

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

exports.saveOpportunity = function(data) {
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
        if (err) throw err;
        var db = client.db("arbibox");
        db.collection("opportunities").updateOne(
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
