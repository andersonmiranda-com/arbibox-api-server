const app = require("./express");
var server = require("http").Server(app);
var socketio = require("socket.io")(server);
const config = require("./config");
const messageController = require("../message/messageController");

const sockets = {};

server.listen(config.port, () => {
    console.info(`\nAPI server started on port ${config.port} (${config.env})`); // eslint-disable-line no-console
});

socketio.on("connection", socket => {
    console.log("socket connection");

    socket.on("init", userId => {
        console.log("socket init", userId);
        sockets[userId.senderId] = socket;
    });

    socket.on("message", message => {
        if (sockets[message.receiverId]) {
            sockets[message.receiverId].emit("message", message);
        }

        console.log("message received", message);
        //salva mensagem
        messageController.onSaveMessage(message);
    });

    socket.on("isTyping", message => {
        if (sockets[message.receiverId]) {
            sockets[message.receiverId].emit("isTyping", message);
        }
    });

    socket.on("disconnect", userId => {
        console.log("socket disconnect", userId);

        delete sockets[userId.senderId];
    });
});

module.exports = socketio;
