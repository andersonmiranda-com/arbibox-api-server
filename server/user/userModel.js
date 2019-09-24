var mongoose = require("mongoose");

// Setup schema
var userSchema = mongoose.Schema({
    first_name: String,
    last_name: String,
    fbId: String,
    image: String,
    last_login: Date,
    location: mongoose.Schema.Types.Mixed,
    gender: String,
    birthday: Date,
    showMen: Boolean,
    showMe: Boolean,
    bio: String,
    showWomen: Boolean,
    distance: Number,
    ageRange: Array
});

// Export Contact model
var User = (module.exports = mongoose.model("user", userSchema));
