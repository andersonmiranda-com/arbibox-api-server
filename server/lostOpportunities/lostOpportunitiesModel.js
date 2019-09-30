var mongoose = require("mongoose");

// Box schema
var lostOpportunitiesSchema = mongoose.Schema({
    userId: String,
    boxId: String,
    createdAt: Date,
    symbol: String,
    buyAt: String,
    sellAt: String,
    base: String,
    quote: String,
    maxInvestBase: Number,
    maxInvestQuote: Number,
    profitPercent: Number,
    profit: Number,
    status: String,
    statusMessage: String
});
// Export Contact model
var LostOpportunities = (module.exports = mongoose.model(
    "lost_opportunities",
    lostOpportunitiesSchema
));
