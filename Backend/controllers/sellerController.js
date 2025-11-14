const Order = require("../models/order");
const Return = require("../models/return");
const mongoose = require("mongoose");
const Product = require("../models/product");
const Review = require("../models/review");

// GET /api/seller/my-sales
const getMySales = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { seller: req.user._id };

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate("buyer", "name email")
        .populate("orderItems.product", "title price images")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: { orders, totalPages: Math.ceil(total / limit), currentPage: page },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// NOTE: Order detail access for seller is handled by the centralized
// `orderController.getOrderById` at `GET /api/orders/:orderId`.
// That endpoint allows buyer, seller, or admin to view an order and
// prevents duplication of access-logic here. The previous
// `getMySaleById` implementation was removed in favor of that.

// GET /api/seller/my-returns
const getMyReturns = async (req, res) => {
  try {
    const returns = await Return.find({ seller: req.user._id })
      .populate("order", "totalPrice orderStatus")
      .populate("buyer", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: returns });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/seller/my-returns/:id/status
const updateReturnStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolution, refundInfo } = req.body;

    const ret = await Return.findById(id);
    if (!ret)
      return res.status(404).json({ message: "Return request not found" });
    if (ret.seller.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Access denied" });

    // basic allowed statuses for seller actions
    const allowed = ["Approved", "Rejected", "Received by Seller", "Completed"];
    if (status && !allowed.includes(status))
      return res.status(400).json({ message: "Invalid status" });

    if (status) ret.status = status;
    if (resolution) ret.resolution = resolution;
    if (refundInfo) ret.refundInfo = refundInfo;

    await ret.save();

    res.json({ success: true, message: "Return updated", data: ret });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/seller/dashboard
const getDashboardStats = async (req, res) => {
  try {
    const sellerId = req.user._id;

    // total orders and revenue (exclude cancelled/payment failed)
    const ordersMatch = {
      seller: sellerId,
      orderStatus: { $nin: ["Cancelled", "Payment Failed"] },
    };
    const [orderAgg] = await Order.aggregate([
      { $match: ordersMatch },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$totalPrice" },
        },
      },
    ]);

    const totalOrders = orderAgg ? orderAgg.totalOrders : 0;
    const totalRevenue = orderAgg ? orderAgg.totalRevenue : 0;

    // total products
    const totalProducts = await Product.countDocuments({
      sellerId: sellerId,
      isDeleted: false,
    });

    // pending returns
    const pendingReturns = await Return.countDocuments({
      seller: sellerId,
      status: "Requested",
    });

    // average rating for seller
    const [ratingAgg] = await Review.aggregate([
      {
        $match: {
          sellerId: mongoose.Types.ObjectId(sellerId),
          status: "visible",
        },
      },
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
          ratingCount: { $sum: 1 },
        },
      },
    ]);

    const avgRating = ratingAgg ? ratingAgg.avgRating : 0;
    const ratingCount = ratingAgg ? ratingAgg.ratingCount : 0;

    // top products by quantity sold (from orders)
    const topProducts = await Order.aggregate([
      { $match: { seller: sellerId } },
      { $unwind: "$orderItems" },
      {
        $group: {
          _id: "$orderItems.product",
          qtySold: { $sum: "$orderItems.quantity" },
        },
      },
      { $sort: { qtySold: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          productId: "$_id",
          qtySold: 1,
          "product.title": "$product.title",
          "product.price": "$product.price",
          "product.images": "$product.images",
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        totalOrders,
        totalRevenue,
        totalProducts,
        pendingReturns,
        avgRating,
        ratingCount,
        topProducts,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getMySales,
  // getMySaleById removed; use `GET /api/orders/:orderId` (orderController.getOrderById)
  getMyReturns,
  updateReturnStatus,
  getDashboardStats,
};
