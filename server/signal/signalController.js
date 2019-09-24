const mongoose = require("mongoose");
const moment = require("moment");

const Signal = require("./signalModel");

// Handle index actions
exports.index = function(req, res) {
    Signal.find(
        {},
        {
            code: 1,
            signal_created_at: 1,
            symbol: 1,
            base: 1,
            quote: 1,
            buy_at: 1,
            ask: 1,
            buy_at_low_volume: 1,
            sell_at: 1,
            bid: 1,
            sell_at_low_volume: 1,
            profit_percent: 1
        }
    )
        .sort({ profit_percent: -1 })
        .then(signals => {
            res.json(signals); // eslint-disable-line no-param-reassign
        })
        .catch(e => res.json(e));
};

// Handle create contact actions
exports.new = function(req, res) {
    const user = new User();
    user.first_name = req.body.first_name ? req.body.first_name : contact.first_name;
    user.last_name = req.body.gender;
    user.gender = req.body.gender;
    user.birthday = req.body.birthday;

    // save the contact and check for errors
    user.save(err => {
        // if (err)
        //     res.json(err);

        res.json({
            message: "New user created!",
            data: contact
        });
    });
};

// Handle view contact info
exports.view = function(req, res) {
    User.findById(req.params._id)
        .then(result => {
            res.json(result);
        })
        .catch(err => res.json({ status: "error", message: err }));
};

// Handle update contact info
exports.update = function(req, res) {
    User.findById(req.params.contact_id, (err, user) => {
        if (err) res.send(err);
        user.first_name = req.body.first_name ? req.body.first_name : user.first_name;
        user.last_name = req.body.gender;
        user.gender = req.body.gender;
        user.birthday = req.body.birthday;
        // save the contact and check for errors
        user.save(err => {
            if (err) res.json(err);
            res.json({
                message: "Contact Info updated",
                data: user
            });
        });
    });
};

// Handle delete contact
exports.delete = function(req, res) {
    User.remove(
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
    const _id = req.body._id;
    const userData = req.body.userData;
    const upsert = req.body.upsert || false;

    // console.log(_id, userData, upsert);

    // mongoose.connection.db.collection("relations"). acessa o comando nativo do MOngoDB
    User.updateOne({ _id: _id.toString() }, { $set: userData }, { upsert })
        .then(result => res.json({ status: "ok" }))
        .catch(err => res.json({ status: "error", message: err }));
};
