const express = require("express");
const router = express.Router();
const returnController = require("../controllers/returnController");
const { protect } = require("../middlewares/auth");

// Buyer routes
router.post("/request", protect, returnController.requestReturn);
router.get("/my-returns", protect, returnController.getMyReturns);
router.get("/:returnId", protect, returnController.getReturnById);
router.get("/order/:orderId", protect, returnController.getReturnsByOrderId);

// Seller/Admin routes
router.get("/seller/all", protect, returnController.getSellerReturns);
router.put("/:returnId/approve", protect, returnController.approveReturn);
router.put("/:returnId/reject", protect, returnController.rejectReturn);

module.exports = router;