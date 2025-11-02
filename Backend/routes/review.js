const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const { protect } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const {
  createReviewSchema,
  updateReviewSchema,
} = require("../validations/review");

// Public - get visible reviews for product
router.get("/product/:productId", reviewController.getProductReviews);

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
