const mongoose = require("mongoose");

const LostOpportunities = require("./lostOpportunitiesModel");

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

    LostOpportunities.aggregate([
        { $match: match },
        {
            $project: {
                userId: 1,
                boxId: 1,
                createdAt: 1,
                symbol: 1,
                buyAt: 1,
                ask: 1,
                sellAt: 1,
                bid: 1,
                base: 1,
                quote: 1,
                invest: 1,
                wallets: 1,
                minInvestQuote: "$invest.min.quote",
                maxInvestQuote: "$invest.max.quote",
                profit: "$invest.max.profit",
                status: 1,
                statusMessage: 1
            }
        }
    ])
        .then(boxes => {
            res.json(boxes); // eslint-disable-line no-param-reassign
        })
        .catch(e => res.json(e));
};

// Handle view contact info
exports.view = function(req, res) {
    LostOpportunities.findById(req.params._id)
        .then(result => {
            res.json(result);
        })
        .catch(err => res.json({ status: "error", message: err }));
};
