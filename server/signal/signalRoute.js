const router = require("express").Router();
const signalController = require("./signalController");

router
    .route("/")
    .get(signalController.index)
    .post(signalController.new);

router
    .route("/:_id")
    .get(signalController.view)
    .patch(signalController.update)
    .put(signalController.update)
    .delete(signalController.delete);

// Export API routes
module.exports = router;
