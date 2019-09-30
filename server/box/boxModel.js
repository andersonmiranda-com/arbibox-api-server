var mongoose = require("mongoose");

// Box schema
var boxSchema = mongoose.Schema({
    createdAt: Date,
    userId: String,
    name: String,
    exchanges: Array,
    baseCurrencies: Array,
    quoteCurrencies: Array,
    minimumProfitPercent: Number,
    maxAmountPercent: Number,
    tradeBack: Boolean,
    tradeBackProfit: Number,
    acceptLowVolume: Boolean,
    active: Boolean,
    executionActive: Boolean
});
// Export Contact model
var Box = (module.exports = mongoose.model("box", boxSchema));
