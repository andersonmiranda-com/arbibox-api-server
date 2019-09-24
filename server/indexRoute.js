// Initialize express router
const router = require("express").Router();
const config = require("./config/config");
const signalRoutes = require("./signal/signalRoute");
const topCoinRoutes = require("./topCoin/topCoinRoute");

// Set default API response
router.get("/", function(req, res) {
    res.json({
        status: "API Its Working",
        message: "Welcome to ArbiBox Backend Server"
    });
});

router.get("/env", (req, res) => res.json(config));

router.use("/signals", signalRoutes);
router.use("/topcoins", topCoinRoutes);

// Export API routes
module.exports = router;
