const express = require("express");
const router = express.Router();
const { protect, isSeller } = require("../middlewares/auth");
const sellerController = require("../controllers/sellerController");

// Seller sales
router.get("/my-sales", protect, isSeller, sellerController.getMySales);
router.get("/my-sales/:id", protect, isSeller, sellerController.getMySaleById);

// Condensed dashboard stats for seller UI
router.get("/dashboard", protect, isSeller, sellerController.getDashboardStats);

// Returns management
router.get("/my-returns", protect, isSeller, sellerController.getMyReturns);
router.put(
  "/my-returns/:id/status",
  protect,
  isSeller,
  sellerController.updateReturnStatus
);

module.exports = router;
