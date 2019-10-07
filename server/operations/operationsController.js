const mongoose = require("mongoose");

const Operations = require("./operationsModel");

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

    Operations.aggregate([
        { $match: match },
        {
            $project: {
                userId: 1,
                boxId: 1,
                createdAt: 1,
                symbol: 1,
                buyAmount: 1,
                buyAt: 1,
                buyPrice: 1,
                buyCost: 1,
                sellAt: 1,
                sellPrice: 1,
                sellCost: 1,
                profit: 1,
                profitPercent: 1,
                base: 1,
                quote: 1,
                status: 1
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
    Operations.findById(req.params._id)
        .then(result => {
            res.json(result);
        })
        .catch(err => res.json({ status: "error", message: err }));
};
