const router = require("express").Router();
const userController = require("./userController");

router
    .route("/")
    .get(userController.index)
    .post(userController.new);

router
    .route("/:_id")
    .get(userController.view)
    .patch(userController.update)
    .put(userController.update)
    .delete(userController.delete);

router.route("/save").post(userController.save);
router.route("/getCards").post(userController.getCards);

// Export API routes
module.exports = router;
