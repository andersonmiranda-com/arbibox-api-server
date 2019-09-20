var mongoose = require("mongoose");

// Setup schema
var relationSchema = mongoose.Schema({
    swipes: []
});

// Export Contact model
var Relation = (module.exports = mongoose.model("relation", relationSchema));

module.exports.get = function(callback, limit) {
    Relation.find(callback).limit(limit);
};
