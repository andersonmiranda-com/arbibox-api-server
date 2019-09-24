// Import contact model
const Relation = require("./relationModel");
const mongoose = require("mongoose");

exports.save = function(req, res) {
    let { userId, itemId, type } = req.body;
    userId = mongoose.Types.ObjectId(userId);
    itemId = mongoose.Types.ObjectId(itemId);

    console.log("relation", userId, itemId, type);

    //mongoose.connection.db.collection("relations"). acessa o comando nativo do MOngoDB
    Relation.updateOne(
        { _id: userId },
        { $push: { swipes: { uid: itemId, type: type, createdAt: new Date()} } },
        { upsert: true }
    )
        .then(res => res.json({ status: "ok" }))
        .catch(err => res.json({ status: "error", message: err }));
};
