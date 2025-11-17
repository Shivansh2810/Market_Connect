const express = require("express");
const router = express.Router();
const { protect, isSeller } = require("../middlewares/auth");
const sellerController = require("../controllers/sellerController");

router.get("/my-sales", protect, isSeller, sellerController.getMySales);
router.get("/my-sales/:id", protect, isSeller, (req, res) => {
  const orderId = req.params.id;
  return res.redirect(`/api/orders/${orderId}`);
});


router.get("/dashboard", protect, isSeller, sellerController.getDashboardStats);


router.get("/my-returns", protect, isSeller, sellerController.getMyReturns);
router.put(
  "/my-returns/:id/status",
  protect,
  isSeller,
  sellerController.updateReturnStatus
);

module.exports = router;
