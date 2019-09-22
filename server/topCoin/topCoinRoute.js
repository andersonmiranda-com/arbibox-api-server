const router = require("express").Router();
const topCoinController = require("./topCoinController");

router
    .route("/")
    .get(topCoinController.index)
    .post(topCoinController.new);

router
    .route("/:_id")
    .get(topCoinController.view)
    .patch(topCoinController.update)
    .put(topCoinController.update)
    .delete(topCoinController.delete);

// Export API routes
module.exports = router;
