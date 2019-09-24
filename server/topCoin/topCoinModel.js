var mongoose = require("mongoose");

// Signal schema
var cmcTopCoinSchema = mongoose.Schema({
    id: String,
    name: String,
    symbol: String,
    rank: Number,
    price_usd: Number,
    price_btc: Number,
    "24h_volume_usd": Number,
    market_cap_usd: Number,
    available_supply: Number,
    total_supply: Number,
    max_supply: Number,
    percent_change_1h: Number,
    percent_change_24h: Number,
    percent_change_7d: Number,
    last_updated: String
});

// Export Contact model
var cmcTopCoin = (module.exports = mongoose.model("cmc_top_coin", cmcTopCoinSchema));
