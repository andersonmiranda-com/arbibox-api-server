const mongoose = require("mongoose");
const moment = require("moment");
const _ = require("lodash");

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
  let periodFilter = req.body.periodFilter;
  let order = req.body.order;
  let orderBy = req.body.orderBy;

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

  if (periodFilter !== "All") {
    switch (periodFilter) {
      case "today":
        var start = moment()
          .startOf("day")
          .toDate();
        var end = moment()
          .endOf("day")
          .toDate();
        break;

      case "yesterday":
        var start = moment()
          .subtract(1, "days")
          .startOf("day")
          .toDate();
        var end = moment()
          .subtract(1, "days")
          .endOf("day")
          .toDate();
        break;

      case "thisWeek":
        var start = moment()
          .startOf("week")
          .toDate();
        var end = moment()
          .endOf("week")
          .toDate();
        break;

      case "lastWeek":
        var start = moment()
          .subtract(1, "weeks")
          .startOf("week")
          .toDate();

        var end = moment()
          .subtract(1, "weeks")
          .endOf("week")
          .toDate();
        break;

      case "thisMonth":
        var start = moment()
          .startOf("month")
          .toDate();
        var end = moment()
          .endOf("month")
          .toDate();
        break;

      case "lastMonth":
        var start = moment()
          .subtract(1, "months")
          .startOf("month")
          .toDate();
        var end = moment()
          .subtract(1, "months")
          .endOf("month")
          .toDate();
        break;

      case "thisYear":
        var start = moment()
          .startOf("year")
          .toDate();
        var end = moment()
          .endOf("year")
          .toDate();
        break;
      case "lastYear":
        var start = moment()
          .subtract(1, "years")
          .startOf("year")
          .toDate();
        var end = moment()
          .subtract(1, "years")
          .endOf("year")
          .toDate();
        break;
    }

    match.createdAt = { $gte: start, $lt: end };
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
    { $sort: { [orderBy]: order === "desc" ? -1 : 1 } },
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

  totals = _.sortBy(totals, [
    function(c) {
      return c._id;
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
