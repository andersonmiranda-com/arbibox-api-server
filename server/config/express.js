const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const routes = require("../indexRoute");
const config = require("./config");

const app = express();

// parse body params and attache them to req.body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/* app.get("/", function(req, res) {
    res.sendFile(path.join(__dirname + "/static_html/index.html"));
});
 */
app.use("/", express.static(path.join(__dirname + "/static_html/")));
app.use("/api", routes);

module.exports = app;
