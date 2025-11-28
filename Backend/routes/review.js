const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const { protect } = require("../middlewares/auth");
const validate = require("../middlewares/validateSchema");
const {
  createReviewSchema,
  updateReviewSchema,
} = require("../validations/review");

// --- NEW ROUTE ADDED HERE ---
// Protected - Get all reviews written by the current logged-in user
// This must match the api.get('/reviews/my-reviews') call in your frontend service
router.get("/my-reviews", protect, reviewController.getMyReviews);
// ----------------------------

// Public - get visible reviews for product
router.get("/product/:productId", reviewController.getProductReviews);

// Public - seller stats (avg rating, per-product breakdown)
router.get("/seller/:sellerId/stats", reviewController.getSellerStats);

// Protected - current seller stats
router.get(
  "/me/seller/stats",
  protect,
  require("../middlewares/auth").isSeller,
  (req, res, next) => {
    req.params.sellerId = req.user._id.toString();
    next();
  },
  reviewController.getSellerStats
);

// Protected - create review (buyer must have purchased product)
router.post(
  "/",
  protect,
  validate(createReviewSchema, "body"),
  reviewController.createReview
);

// Protected - update/delete must be owner
router.put(
  "/:reviewId",
  protect,
  validate(updateReviewSchema, "body"),
  reviewController.updateReview
);
router.delete("/:reviewId", protect, reviewController.deleteReview);

module.exports = router;