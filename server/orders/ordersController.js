const mongoose = require("mongoose");
const moment = require("moment");

const Orders = require("./ordersModel");

// Handle index actions
exports.index = function(req, res) {
  let boxId = req.body.boxId;
  let userId = req.body.userId;
  let page = req.body.page;
  let rowsPerPage = req.body.rowsPerPage;
  let statusFilter = req.body.statusFilter;
  let sideFilter = req.body.sideFilter;
  let exchangeFilter = req.body.exchangeFilter;
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

  if (sideFilter !== "All") {
    match.side = sideFilter;
  }

  if (statusFilter !== "All") {
    match.status = statusFilter;
  }

  if (exchangeFilter && exchangeFilter.length > 0) {
    match.exchange = { $in: exchangeFilter };
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
    { $sort: { [orderBy]: order === "desc" ? -1 : 1 } },
    { $skip: page * rowsPerPage },
    { $limit: rowsPerPage }
  ])
    .then(items => {
      Orders.aggregate([{ $match: match }, { $count: "count" }]).then(
        itemsCount => {
          let count = itemsCount[0] ? itemsCount[0].count : 0;
          res.json({ items, itemsCount: count });
        }
      );
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
