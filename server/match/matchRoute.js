const router = require("express").Router();
const matchController = require("./matchController");

router.route("/save").post(matchController.save);
router.route("/getMatches").post(matchController.getMatches);

module.exports = router;
