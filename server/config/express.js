const express = require("express");
var cors = require("cors");
const path = require("path");
const bodyParser = require("body-parser");
const routes = require("../indexRoute");
const config = require("./config");

const app = express();

// parse body params and attache them to req.body
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//app.use("/", express.static(path.join(__dirname + "/static_html/")));
app.use("/api", routes);

module.exports = app;
