const router = require("express").Router();
const messageController = require("./messageController");

router.route("/save").post(messageController.saveMessage);
router.route("/get").post(messageController.getMessages);

module.exports = router;
