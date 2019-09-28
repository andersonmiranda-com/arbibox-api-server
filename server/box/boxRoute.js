const router = require("express").Router();
const boxController = require("./boxController");

router
    .route("/")
    .get(boxController.index)
    .post(boxController.save);

router
    .route("/:_id")
    .get(boxController.view)
    .put(boxController.update)
    .delete(boxController.delete);

// Export API routes
module.exports = router;
