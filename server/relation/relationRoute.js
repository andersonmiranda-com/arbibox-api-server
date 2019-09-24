const router = require("express").Router();
const relationController = require("./relationController");

router.route("/save").post(relationController.save);

module.exports = router;
