var mongoose = require("mongoose");

// Signal schema
var signalSchema = mongoose.Schema({
    code: String,
    time_block: Number,
    signal_created_at: Date,
    type: String,
    symbol: String,
    base: String,
    quote: String,
    buy_at: String,
    ask: Number,
    buy_at_low_volume: Boolean,
    sell_at: String,
    bid: Number,
    sell_at_low_volume: Boolean,
    profit_percent: Number,
    bestAsk: Object,
    bestBid: Object,
    invest: Object
});

// Export Contact model
var Signal = (module.exports = mongoose.model("signal", signalSchema));
