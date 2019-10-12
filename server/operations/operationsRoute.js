const router = require("express").Router();
const operationsController = require("./operationsController");

router.route("/").post(operationsController.index);

router.route("/:_id").get(operationsController.view);

// Export API routes
module.exports = router;
