const router = require("express").Router();
const ordersController = require("./ordersController");

router.route("/").post(ordersController.index);

router.route("/:_id").get(ordersController.view);

// Export API routes
module.exports = router;
