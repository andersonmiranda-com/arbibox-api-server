const mongoose = require("mongoose");
const moment = require("moment");

const Box = require("./boxModel");

// Handle index actions
exports.index = function(req, res) {
    Box.find({})
        .then(boxes => {
            console.log(boxes);
            res.json(boxes); // eslint-disable-line no-param-reassign
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
    const _id = req.params._id;
    Box.remove(
        {
            _id: mongoose.mongo.ObjectId(_id)
        },
        (err, contact) => {
            if (err) res.send(err);

            res.json({
                status: "success",
                message: "Box deleted"
            });
        }
    );
};

exports.save = function(req, res) {
    const _id = req.body._id;
    const data = req.body;
    const upsert = true;

    // console.log(_id, userData, upsert);

    // mongoose.connection.db.collection("relations"). acessa o comando nativo do MOngoDB
    Box.updateOne({ _id: mongoose.mongo.ObjectId(_id) }, { $set: data }, { upsert })
        .then(result => {
            return res.json({ status: "ok", result });
        })
        .catch(err => {
            console.log(err);
            return res.json({ status: "error", message: err });
        });
};
