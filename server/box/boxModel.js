var mongoose = require("mongoose");

// Box schema
var boxSchema = mongoose.Schema({
    user_id: Number,
    created_at: Date,
    name: String,
    exchanges: Array,
    baseCurrencies: Array,
    quoteCurrencies: Array,
    minimumProfitPercent: Number,
    maxAmountPercent: Number,
    tradeBack: Boolean,
    acceptLowVolume: Boolean,
    active: Boolean,
    executionActive: Boolean
});

// Export Contact model
var Box = (module.exports = mongoose.model("box", boxSchema));
