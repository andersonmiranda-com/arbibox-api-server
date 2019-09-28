const mongoose = require("mongoose");
const moment = require("moment");

const Box = require("./boxModel");

// Handle index actions
exports.index = function(req, res) {
    Box.find(
        {},
        {
            userId: 1,
            createdAt: 1,
            name: 1,
            exchanges: 1,
            baseCurrencies: 1,
            quoteCurrencies: 1,
            minimunProfitPercent: 1,
            maxAmountPercent: 1,
            tradeBack: 1,
            active: 1
        }
    )
        .sort({ profit_percent: -1 })
        .then(boxs => {
            res.json(boxs); // eslint-disable-line no-param-reassign
        })
        .catch(e => res.json(e));
};

// Handle view contact info
exports.view = function(req, res) {
    Box.findById(req.params._id)
        .then(result => {
            res.json(result);
        })
        .catch(err => res.json({ status: "error", message: err }));
};

// Handle update contact info
exports.update = function(req, res) {
    Box.update(req.params._id)
        .then(result => {
            res.json(result);
        })
        .catch(err => res.json({ status: "error", message: err }));
};

// Handle delete contact
exports.delete = function(req, res) {
    Box.remove(
        {
            _id: req.params._id
        },
        (err, contact) => {
            if (err) res.send(err);

            res.json({
                status: "success",
                message: "Contact deleted"
            });
        }
    );
};

exports.save = function(req, res) {
    console.log(req.body);
    const _id = req.body._id;
    const data = req.body;
    const upsert = req.body.upsert || false;

    // console.log(_id, userData, upsert);

    // mongoose.connection.db.collection("relations"). acessa o comando nativo do MOngoDB
    Box.updateOne({ _id: mongoose.mongo.ObjectId(_id) }, { $set: data }, { upsert })
        .then(result => res.json({ status: "ok" }))
        .catch(err => {
            console.log(err);
            return res.json({ status: "error", message: err });
        });
};
