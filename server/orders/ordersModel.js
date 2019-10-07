var mongoose = require("mongoose");

// Box schema
var ordersSchema = mongoose.Schema({
    userId: String,
    boxId: String,
    createdAt: Date,
    symbol: String,
    strategy: String,
    symbol: String,
    amount: String,
    exchange: String,
    side: String,
    type: String,
    price: String,
    status: String,
    statusMessage: String
});
// Export Contact model
var Orders = (module.exports = mongoose.model("order", ordersSchema));
