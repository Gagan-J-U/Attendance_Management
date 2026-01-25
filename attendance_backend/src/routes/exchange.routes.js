const express = require("express");
const router = express.Router();
const exchangeController = require("../controllers/exchange.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");

router.use(authMiddleware);

router.post("/request", roleMiddleware("teacher"), exchangeController.requestExchange);
router.post("/respond", roleMiddleware("teacher"), exchangeController.respondToExchange);

module.exports = router;
