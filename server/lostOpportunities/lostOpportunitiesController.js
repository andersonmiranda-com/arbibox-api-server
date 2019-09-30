const mongoose = require("mongoose");

const LostOpportunities = require("./lostOpportunitiesModel");

// Handle index actions
exports.index = function(req, res) {
    let boxId = req.query.boxId;
    let userId = req.query.userId;

    let match = {};

    if (boxId) {
        match.boxId = mongoose.mongo.ObjectId(boxId);
    }

    if (userId) {
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
                sellAt: 1,
                base: 1,
                quote: 1,
                maxInvestBase: "$invest.max.base",
                maxInvestQuote: "$invest.max.quote",
                profitPercent: "$invest.max.profitPercent",
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
