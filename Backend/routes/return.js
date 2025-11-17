<<<<<<< HEAD
 const express = require("express");
=======
/* const express = require("express");
>>>>>>> 5db66cf7a98cd23d4abdedf7daa79b0a13d21c30
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

module.exports = router; */