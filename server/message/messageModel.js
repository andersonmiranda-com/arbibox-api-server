var mongoose = require("mongoose");

// Setup schema
var messageSchema = mongoose.Schema({
    conversationId: Object,
    text: String,
    createdAt: Date,
    userId: Object,
    sent: Boolean,
    received: Boolean,
    location: Object,
    image: String
});

module.exports = mongoose.model("Message", messageSchema);
