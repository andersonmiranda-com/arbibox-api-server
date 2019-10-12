const mongoose = require("mongoose");

const Operations = require("./operationsModel");

// Handle index actions
exports.index = async function(req, res) {
  let boxId = req.body.boxId;
  let userId = req.body.userId;
  let page = req.body.page;
  let rowsPerPage = req.body.rowsPerPage;
  let statusFilter = req.body.statusFilter;
  let buyAtFilter = req.body.buyAtFilter;
  let sellAtFilter = req.body.sellAtFilter;
  let currencyFilter = req.body.currencyFilter;

  let match = {};

  if (currencyFilter && currencyFilter !== "") {
    match = { $text: { $search: currencyFilter } };
  }

  if (boxId) {
    if (boxId.length != 12 && boxId.length !== 24) return false;
    match.boxId = mongoose.mongo.ObjectId(boxId);
  }

  if (userId) {
    if (userId.length != 12 && userId.length !== 24) return false;
    match.userId = userId;
  }

  if (statusFilter !== "All") {
    match.status = statusFilter;
  }

  if (buyAtFilter && buyAtFilter.length > 0) {
    match.buyAt = { $in: buyAtFilter };
  }

  if (sellAtFilter && sellAtFilter.length > 0) {
    match.sellAt = { $in: sellAtFilter };
  }

  let items = await Operations.aggregate([
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
    { $skip: page * rowsPerPage },
    { $limit: rowsPerPage }
  ]);

  let itemsCount = await Operations.aggregate([
    { $match: match },
    { $count: "count" }
  ]);

  let count = itemsCount[0] ? itemsCount[0].count : 0;

  let totals = await Operations.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$quote",
        total: {
          $sum: "$profit"
        }
      }
    }
  ]);

  res.json({ items, itemsCount: count, totals });
};

// Handle view contact info
exports.view = function(req, res) {
  Operations.findById(req.params._id)
    .then(result => {
      res.json(result);
    })
    .catch(err => res.json({ status: "error", message: err }));
};
