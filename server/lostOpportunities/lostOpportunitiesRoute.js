const router = require("express").Router();
const lostOpportunitiesController = require("./lostOpportunitiesController");

router.route("/").get(lostOpportunitiesController.index);

router.route("/:_id").get(lostOpportunitiesController.view);

// Export API routes
module.exports = router;
