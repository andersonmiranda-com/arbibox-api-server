const mongoose = require("mongoose");
const Message = require("./messageModel");
const Match = require("../match/matchModel");

exports.saveMessage = function(req, res) {
    let { message } = req.body;
    onSaveMessage(message)
        .then(res => res.json({ status: "ok" }))
        .catch(err => res.json({ status: "error", message: err }));
};

exports.onSaveMessage = message => {
    console.log("saving message...", message);

    let { text, conversationId, senderId, createdAt, image, location } = message;
    conversationId = mongoose.Types.ObjectId(conversationId);
    senderId = mongoose.Types.ObjectId(senderId);

    Match.updateOne(
        { _id: conversationId },
        { $set: { lastMessage: { text, userId: senderId, createdAt: Date(createdAt) } } }
    )
        .then(status => {
           return Message.create({
                conversationId,  text, image, location,
                userId: senderId,
                createdAt: new Date(createdAt)
            })
                .then(status => console.log(status))
                .catch(err => console.log(err));
        })
        .catch(err => res.json({ status: "error", message: err }));
};

exports.getMessages = function(req, res) {
    let conversationId = req.body.conversationId;
    conversationId = mongoose.Types.ObjectId(conversationId);
    Message.find({ conversationId: conversationId })
        .then(messages => {
            console.log("messages", messages.length);
            res.json({ id: conversationId, messages: messages });
        })
        .catch(e => {
            console.log(e);
            res.json(e);
        });
};
