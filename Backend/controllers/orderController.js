const Order = require("../models/order");
const Product = require("../models/product");
const User = require("../models/user");
const Coupon = require("../models/coupon");
const { processRefund } = require("./paymentController"); // to handle refunds when cancelling paid orders
const {
  createOrderSchema,
  updateOrderStatusSchema,
} = require("../validations/order");

// -- Create Order (for single product or entire cart)
exports.createOrder = async (req, res) => {
  try {
    // input data validation
    const { error } = createOrderSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid order data",
        errors: error.details.map((e) => e.message),
      });
    }

    const { orderItems, shippingInfo, couponCode } = req.body;

    // verifying user existence
    const user = await User.findById(req.user._id).populate("buyerInfo.cart.productId");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    let finalOrderItems = [];

    // We deal with two scenarios of placing an order here
    // Case 1: Order placed from cart
    if (orderItems.length === 1 && orderItems[0].productId === "cart") {
      if (!user.buyerInfo.cart.length) {
        return res.status(400).json({ success: false, message: "Cart is empty" });
      }

      // Stock Check for Cart
      for (const item of user.buyerInfo.cart) {
        if (!item.productId) {
           return res.status(400).json({ success: false, message: "Invalid item in cart." });
        }
        if (item.productId.stock < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for ${item.productId.title}. Only ${item.productId.stock} left.`,
          });
        }
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

    // Pricing calculation
    // Base Price
    const itemsPrice = finalOrderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Discount
    let discountAmount = 0;
    
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });

      if (!coupon) {
        return res.status(404).json({ success: false, message: "Invalid Coupon Code" });
      }

      // validity based on original Item Price
      if (!coupon.isValid(itemsPrice)) { 
        return res.status(400).json({ success: false, message: "Coupon is not applicable to this order" });
      }

      discountAmount = coupon.calculateDiscount(itemsPrice);
      
      // Update coupon usage
      coupon.usedCount += 1;
      await coupon.save();
    }

    // Apply Discount
    const priceAfterDiscount = Math.max(0, itemsPrice - discountAmount);

    // Tax cAlculation(On Discounted Price)
    const taxPrice = parseFloat((0.18 * priceAfterDiscount).toFixed(2));
    // a standard 18% has been assumed for our project

    // Shipping
    const shippingPrice = priceAfterDiscount > 1000 ? 0 : 50;
    // Arbitrarily applying shipping cost of 50 only to items below price 1000

    // Final Total
    const totalPrice = priceAfterDiscount + taxPrice + shippingPrice;

    // Saving Order
    // Seller assignment logic: Directly storing the seller id of the product in a single order, while that of the first product in a cart order
    const firstProduct = await Product.findById(finalOrderItems[0].product);
    if (!firstProduct) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product reference" });
    }
    const assignedSeller = firstProduct.sellerId;

    const order = new Order({
      buyer: req.user._id,
      seller: assignedSeller,
      shippingInfo,
      orderItems: finalOrderItems,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice, // including dsicount, shipping and tax
      orderStatus: "Payment Pending",
    });

    await order.save();

    // Clearing of cart if needed
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
      message: error.message || "Failed to create order",
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

    // Check if any item in the order belongs to this seller
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

//get auction orders
exports.getMyAuctionOrders = async (req, res) => {
  const orders = await Order.find({
    buyer: req.user._id,
    isAuctionOrder: true
  })
  .populate("auctionProduct", "title images price")
  .sort({ createdAt: -1 });

  res.json({ success: true, data: orders });
};

//address adding for auction orders
exports.setAuctionOrderShipping = async (req, res) => {
  try {
    const { id } = req.params;
    const { shippingInfo } = req.body;

    if (!shippingInfo || !shippingInfo.street || !shippingInfo.city || !shippingInfo.state || !shippingInfo.pincode || !shippingInfo.country) {
      return res.status(400).json({
        success: false,
        message: "Incomplete shipping address",
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (!order.isAuctionOrder) {
      return res.status(400).json({ success: false, message: "Not an auction order" });
    }

    if (order.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    if (order.orderStatus !== "Address Pending") {
      return res.status(400).json({
        success: false,
        message: "Shipping address already set or order is not in Address Pending status",
      });
    }
    order.shippingInfo = shippingInfo;
    order.orderStatus = "Payment Pending";

    await order.save();

    res.json({
      success: true,
      message: "Shipping address added. You can now proceed to payment.",
      data: order,
    });
  } catch (error) {
    console.error("setAuctionOrderShipping error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// -- Cancel order (for buyer)
exports.cancelOrder = async (req, res) => {
  try {
    // Find the order
    const order = await Order.findById(req.params.orderId).populate("payment");
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Authorization Check
    if (order.buyer.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized action" });
    }

    // Check allowed statuses
    if (["Shipped", "Delivered"].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel order after it has been shipped or delivered",
      });
    }

    // Update: Added the logic to refund order after cancellation
    
    // Case A: Order was placed and paid
    if (order.orderStatus === "Order Placed") {
      // Call the helper to process the refund with Razorpay
      // NOTE: processRefund already manages stock restoration
      const refundResult = await processRefund(
        order._id, 
        req.user._id, 
        null, // full refund
        "Order Cancelled by User"
      );

      if (!refundResult.success) {
        return res.status(400).json({
          success: false,
          message: "Failed to process refund: " + refundResult.message,
        });
      }
      
      // If refund successful, mark order as Cancelled
      order.orderStatus = "Cancelled";
      await order.save();
    } 
    
    // Case B: Payment was Pending or Failed (No money taken, no stock deducted)
    else {
      order.orderStatus = "Cancelled";
      await order.save();
    }

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