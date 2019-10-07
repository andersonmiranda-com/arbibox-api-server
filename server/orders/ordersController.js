const mongoose = require("mongoose");

const Orders = require("./ordersModel");

// Handle index actions
exports.index = function(req, res) {
    let boxId = req.query.boxId;
    let userId = req.query.userId;

    let match = {};

    if (boxId) {
        if (boxId.length != 12 && boxId.length !== 24) return false;
        match.boxId = mongoose.mongo.ObjectId(boxId);
    }

    if (userId) {
        if (userId.length != 12 && userId.length !== 24) return false;
        match.userId = userId;
    }

    Orders.aggregate([
        { $match: match },
        {
            $project: {
                userId: 1,
                operationId: 1,
                boxId: 1,
                strategy: 1,
                createdAt: 1,
                symbol: 1,
                amount: 1,
                exchange: 1,
                side: 1,
                type: 1,
                price: 1,
                status: 1,
                statusMessage: "$orderResult.message"
            }
        },
        { $sort: { createdAt: -1 } },
        { $limit: 500 }
    ])
        .then(boxes => {
            res.json(boxes); // eslint-disable-line no-param-reassign
        })
        .catch(e => res.json(e));
};

// Handle view contact info
exports.view = function(req, res) {
    Orders.findById(req.params._id)
        .then(result => {
            res.json(result);
        })
        .catch(err => res.json({ status: "error", message: err }));
};
