const router = require("express").Router();
const boxController = require("./boxController");

router
    .route("/")
    .get(boxController.index)
    .post(boxController.new);

router
    .route("/:_id")
    .get(boxController.view)
    .patch(boxController.update)
    .put(boxController.update)
    .delete(boxController.delete);

// Export API routes
module.exports = router;
