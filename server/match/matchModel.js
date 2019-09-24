var mongoose = require("mongoose");

// Setup schema
var matchSchema = mongoose.Schema({
    match: Array,
    createdAt: Date,
    lastMessage: Object,
});

module.exports = mongoose.model("Match", matchSchema);
