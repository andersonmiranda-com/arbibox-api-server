let mongoose = require("mongoose");

const config = require("./server/config/config");
const app = require("./server/config/express");
const socketio = require("./server/config/socket");

const logo = require("./server/logo");

// make bluebird default Promise
Promise = require("bluebird"); // eslint-disable-line no-global-assign
mongoose.Promise = Promise;

// connect to mongo db
const mongoUri = config.mongo.host;
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connection.on("error", () => {
    throw new Error(`unable to connect to database: ${mongoUri}`);
});

module.exports = app;
