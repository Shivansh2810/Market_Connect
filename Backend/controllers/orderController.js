const Order = require("../models/order");
const Product = require("../models/product");
const User = require("../models/user");
const {
  createOrderSchema,
  updateOrderStatusSchema,
} = require("../validations/order");

// -- Create Order (for single product or entire cart)
exports.createOrder = async (req, res) => {
  try {
    // input data validation
    const { error } = createOrderSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid order data",
        errors: error.details.map((e) => e.message),
      });
    }

    const { orderItems, shippingInfo, payment } = req.body;

    // verifying user existence
    const user = await User.findById(req.user._id).populate(
      "buyerInfo.cart.productId"
    );
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    let finalOrderItems = [];

    // We deal with two scenarios of placing an order here
    // Case 1: Order placed from cart
    if (orderItems.length === 1 && orderItems[0].productId === "cart") {
      if (!user.buyerInfo.cart.length) {
        return res
          .status(400)
          .json({ success: false, message: "Cart is empty" });
      }

      finalOrderItems = user.buyerInfo.cart.map((item) => ({
        product: item.productId._id,
        quantity: item.quantity,
        price: item.productId.price,
        name: item.productId.title,
        image: item.productId.images?.[0]?.url || null,
      }));
    }

    // Case 2: Direct single product order
    else {
      finalOrderItems = await Promise.all(
        orderItems.map(async (item) => {
          const product = await Product.findById(item.productId);
          if (!product) throw new Error(`Product not found: ${item.productId}`);
          if (product.stock < item.quantity)
            throw new Error(`Insufficient stock for ${product.title}`);

          return {
            product: product._id,
            quantity: item.quantity,
            price: product.price,
            name: product.title,
            image: product.images?.[0]?.url || null,
          };
        })
      );
    }

    // Calculate pricing
    const itemsPrice = finalOrderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const taxPrice = parseFloat((0.18 * itemsPrice).toFixed(2)); // Considering standard 18% GST
    const shippingPrice = itemsPrice > 1000 ? 0 : 50; // Arbitrarily applying shipping cost of 50 only to items below price 1000
    const totalPrice = itemsPrice + taxPrice + shippingPrice;

    // Seller assignment logic: Directly storing the seller id of the product in a single order, while that of the first product in a cart order
    const firstProduct = await Product.findById(finalOrderItems[0].product);
    if (!firstProduct) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product reference" });
    }
    const assignedSeller = firstProduct.sellerId;

    // Create new order document
    const order = new Order({
      buyer: req.user._id,
      seller: assignedSeller, // assigned through above logic
      shippingInfo,
      orderItems: finalOrderItems,
      payment,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      orderStatus: "Payment Pending", // default case until payment is verified
    });

    await order.save();

    // Clearing of the cart if cart order
    if (orderItems.length === 1 && orderItems[0].productId === "cart") {
      user.buyerInfo.cart = [];
      await user.save();
    }

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: order,
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create order",
      error: error.message,
    });
  }
};

// -- Get all orders for the logged-in buyer
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user._id })
      .populate("orderItems.product", "title images price")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      data: orders,
    });
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
};

// -- Get specific order details
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate("buyer", "name email")
      .populate("orderItems.product", "title images price");

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Allow access to the buyer, the seller of the order, or an admin
    const isBuyer =
      order.buyer && order.buyer._id
        ? order.buyer._id.toString() === req.user._id.toString()
        : order.buyer.toString() === req.user._id.toString();

    // Check if any item in the order belongs to this seller (for cart orders)
    const orderItemProducts = await Product.find({
      _id: { $in: order.orderItems.map((item) => item.product) },
      sellerId: req.user._id,
    });
    const isSeller = orderItemProducts.length > 0;

    const isAdmin = req.user && req.user.role === "admin";

    if (!isBuyer && !isSeller && !isAdmin) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    res.status(200).json({
      success: true,
      message: "Order retrieved successfully",
      data: order,
    });
  } catch (error) {
    console.error("Get order by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order details",
      error: error.message,
    });
  }
};

// -- Update order status (permitted to seller/admin)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { error } = updateOrderStatusSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
        error: error.details[0].message,
      });
    }

    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Authorization check -> seller or admin
    const isAdmin = req.user.email === "admin@marketplace.com";

    // Check if any item in the order belongs to this seller (for cart orders)
    const orderItemProducts = await Product.find({
      _id: { $in: order.orderItems.map((item) => item.product) },
      sellerId: req.user._id,
    });
    const isSeller = orderItemProducts.length > 0;

    if (!isAdmin && !isSeller) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only seller or admin can update order status.",
      });
    }

    // Updating order status
    order.orderStatus = req.body.status;
    await order.save();

    // Note: Yet to handle stock adjustments on cancellation/return later, after integration of payment and returns

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: order,
    });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update order status",
      error: error.message,
    });
  }
};

// -- Cancel order (for buyer)
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (order.buyer.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized action" });
    }

    if (["Shipped", "Delivered"].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel order after it has been shipped or delivered",
      });
    }

    order.orderStatus = "Cancelled";
    await order.save();

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      data: order,
    });
  } catch (error) {
    console.error("Cancel order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel order",
      error: error.message,
    });
  }
};
