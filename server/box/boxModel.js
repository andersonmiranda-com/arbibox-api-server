var mongoose = require("mongoose");

// Box schema
var boxSchema = mongoose.Schema({
    user_id: Number,
    created_at: Date,
    name: String,
    exchanges: Array,
    baseCurrencies: Array,
    quoteCurrencies: Array,
    minimunProfitPercent: Number,
    axAmountPercent: Number,
    tradeBack: Boolean,
    qualifyLowVolume: Boolean
});

// Export Contact model
var Box = (module.exports = mongoose.model("box", boxSchema));
