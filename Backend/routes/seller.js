const express = require("express");
const router = express.Router();
const { protect, isSeller } = require("../middlewares/auth");
const sellerController = require("../controllers/sellerController");

// Seller sales
router.get("/my-sales", protect, isSeller, sellerController.getMySales);
// Order details are now served by the canonical orders controller:
// GET /api/orders/:orderId -> controllers/orderController.getOrderById
// The seller can access their order via that endpoint (seller/admin/buyer access handled there).
// Removed duplicate route: router.get("/my-sales/:id", ...)
// Temporary compatibility redirect for existing clients that use the
// seller-specific route. This will issue a 302 redirect to the
// canonical order endpoint. Frontends should migrate to `/api/orders/:id`.
router.get("/my-sales/:id", protect, isSeller, (req, res) => {
  const orderId = req.params.id;
  return res.redirect(`/api/orders/${orderId}`);
});

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
