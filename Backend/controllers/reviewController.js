const Review = require("../models/review");
const Product = require("../models/product");
const Order = require("../models/order");

const {
  createReviewSchema,
  updateReviewSchema,
} = require("../validations/review");

// GET /api/reviews/product/:productId
const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const reviews = await Review.find({ productId, status: "visible" })
      .populate("buyerId", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/reviews
const createReview = async (req, res) => {
  try {
    const { error, value } = createReviewSchema.validate(req.body);
    if (error)
      return res.status(400).json({ message: error.details[0].message });

    const { productId, orderId, rating, comment, images } = value;

    // verify product exists and get seller
    const product = await Product.findById(productId).select("sellerId");
    if (!product) return res.status(404).json({ message: "Product not found" });

    // verify order belongs to this buyer and contains the product
    const order = await Order.findOne({
      _id: orderId,
      buyer: req.user._id,
      "orderItems.product": productId,
    });
    if (!order)
      return res
        .status(400)
        .json({ message: "You can only review products you have purchased" });

    const review = new Review({
      productId,
      sellerId: product.sellerId,
      buyerId: req.user._id,
      orderId,
      rating,
      comment,
      images,
    });

    try {
      await review.save();
    } catch (err) {
      if (err.code === 11000) {
        return res
          .status(400)
          .json({ message: "You have already reviewed this product" });
      }
      throw err;
    }

    res
      .status(201)
      .json({ success: true, message: "Review submitted", data: review });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/reviews/:reviewId
const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { error, value } = updateReviewSchema.validate(req.body);
    if (error)
      return res.status(400).json({ message: error.details[0].message });

    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ message: "Review not found" });

    if (review.buyerId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You are not the owner of this review" });
    }

    if (value.rating !== undefined) review.rating = value.rating;
    if (value.comment !== undefined) review.comment = value.comment;
    if (value.images !== undefined) review.images = value.images;

    await review.save();
    res.json({ success: true, message: "Review updated", data: review });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/reviews/:reviewId
const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ message: "Review not found" });

    if (review.buyerId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You are not the owner of this review" });
    }

    await review.remove();
    res.json({ success: true, message: "Review deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
};
