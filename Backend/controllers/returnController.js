const Return = require("../models/return");
const Order = require("../models/order");
const Payment = require("../models/payment");
const Product = require("../models/product");
//const Razorpay = require("razorpay");
const { processRefund } = require("./paymentController"); //centralized Helper function imported from payment controller
const { requestReturnSchema, rejectReturnSchema } = require("../validations/return");

// const razorpayInstance = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET,
// });

// -- REQUEST RETURN (BUYER): Creates separate return requests per seller
exports.requestReturn = async (req, res) => {
  try {
    const { error } = requestReturnSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.details.map((e) => e.message),
      });
    }

    const { orderId, items, reason, description } = req.body;

    // Validate input
    if (!orderId || !reason || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order ID, reason, and items are required",
      });
    }

    // Fetch order with all necessary data
    const order = await Order.findById(orderId)
      .populate("payment")
      .populate("orderItems.product");

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found" 
      });
    }

    // Authorization check - only buyer can request return
    if (order.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: "Unauthorized access" 
      });
    }

    // Check if order is delivered
    if (order.orderStatus !== "Delivered") {
      return res.status(400).json({
        success: false,
        message: "Only delivered orders can be returned",
      });
    }

    // Check if payment was successful
    if (!order.payment || order.payment.status !== "captured") {
      return res.status(400).json({
        success: false,
        message: "Cannot return order with unsuccessful payment",
      });
    }

    // Check if any items from this order are already in a return (pending, approved, rejected, or completed)
    const existingReturns = await Return.find({ 
      order: orderId,
      status: { $in: ["Requested", "Approved", "Rejected", "Completed"] }
    });

    if (existingReturns.length > 0) {
      // Check for duplicate items
      const alreadyReturnedProductIds = new Set();
      existingReturns.forEach(ret => {
        ret.items.forEach(item => {
          alreadyReturnedProductIds.add(item.product.toString());
        });
      });

      const duplicateItems = items.filter(item => 
        alreadyReturnedProductIds.has(item.productId)
      );

      if (duplicateItems.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Some items already have pending return requests",
        });
      }
    }

    // GROUP ITEMS BY SELLER
    const itemsBySeller = new Map(); // sellerId => array of items

    for (const returnItem of items) {
      // Find matching order item
      const orderItem = order.orderItems.find(
        (item) => item.product._id.toString() === returnItem.productId
      );

      if (!orderItem) {
        return res.status(400).json({
          success: false,
          message: `Product ${returnItem.productId} not found in this order`,
        });
      }

      // Validate quantity
      if (returnItem.quantity > orderItem.quantity) {
        return res.status(400).json({
          success: false,
          message: `Cannot return ${returnItem.quantity} of ${orderItem.name}. Only ${orderItem.quantity} were ordered.`,
        });
      }

      if (returnItem.quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid quantity for ${orderItem.name}`,
        });
      }

      // Get seller from product (IMP)
      const sellerId = orderItem.product.sellerId.toString();

      // Initialize seller group if not exists
      if (!itemsBySeller.has(sellerId)) {
        itemsBySeller.set(sellerId, []);
      }

      // Add item to seller's group
      itemsBySeller.get(sellerId).push({
        product: orderItem.product._id,
        quantity: returnItem.quantity,
        price: orderItem.price,
        name: orderItem.name,
        orderItemQuantity: orderItem.quantity, // Store for further calculation
      });
    }

    // CREATE SEPARATE RETURN REQUEST FOR EACH SELLER
    const createdReturns = [];
    let totalRefundAmount = 0;

    for (const [sellerId, sellerItems] of itemsBySeller) {
      // Calculate refund for this seller's items
      let sellerItemsTotal = 0;
      
      for (const item of sellerItems) {
        sellerItemsTotal += item.price * item.quantity;
      }

      // Calculate proportional tax refund
      const itemsRefundRatio = sellerItemsTotal / order.itemsPrice;
      const taxRefund = parseFloat((order.taxPrice * itemsRefundRatio).toFixed(2));

      // Determine if shipping should be refunded
      // Note: Shipping is refunded only if ALL items from entire order are being returned
      let isFullOrderReturn = true;
      
      // Get all return requests for this order (including the ones we're creating)
      const allReturnedProductIds = new Set();
      existingReturns.forEach(ret => {
        ret.items.forEach(item => {
          allReturnedProductIds.add(item.product.toString());
        });
      });
      
      // Add current return items
      for (const [sid, sitems] of itemsBySeller) {
        sitems.forEach(item => {
          allReturnedProductIds.add(item.product.toString());
        });
      }

      // Check if all order items are being returned
      for (const orderItem of order.orderItems) {
        const isReturned = allReturnedProductIds.has(orderItem.product.toString());
        
        if (!isReturned) {
          isFullOrderReturn = false;
          break;
        }
        
        // Check if full quantity is returned
        let returnedQty = 0;
        existingReturns.forEach(ret => {
          const retItem = ret.items.find(ri => 
            ri.product.toString() === orderItem.product.toString()
          );
          if (retItem) returnedQty += retItem.quantity;
        });
        
        for (const [sid, sitems] of itemsBySeller) {
          const retItem = sitems.find(ri => 
            ri.product.toString() === orderItem.product.toString()
          );
          if (retItem) returnedQty += retItem.quantity;
        }
        
        if (returnedQty < orderItem.quantity) {
          isFullOrderReturn = false;
          break;
        }
      }

      // Proportional shipping refund
      const shippingRefund = isFullOrderReturn 
        ? parseFloat((order.shippingPrice * itemsRefundRatio).toFixed(2))
        : 0;

      const sellerRefundAmount = parseFloat(
        (sellerItemsTotal + taxRefund + shippingRefund).toFixed(2)
      );

      // Remove temporary field before saving
      const itemsToSave = sellerItems.map(item => ({
        product: item.product,
        quantity: item.quantity,
        price: item.price,
        name: item.name,
      }));

      // Create return request for this seller
      const returnRequest = new Return({
        order: orderId,
        buyer: req.user._id,
        seller: sellerId, // This the seller of the individual product
        items: itemsToSave,
        reason,
        description: description || "",
        status: "Requested",
        refundAmount: sellerRefundAmount,
      });

      await returnRequest.save();
      createdReturns.push(returnRequest);
      totalRefundAmount += sellerRefundAmount;
    }

    // Update order status to "Returned", since buyer has made request
    order.orderStatus = "Returned";
    await order.save();

    res.status(201).json({
      success: true,
      message: `${createdReturns.length} return request(s) created successfully. Awaiting seller approval.`,
      data: {
        returns: createdReturns,
        summary: {
          totalReturns: createdReturns.length,
          totalRefundAmount: parseFloat(totalRefundAmount.toFixed(2)),
          sellersInvolved: createdReturns.map(r => r.seller),
        },
      },
    });
  } catch (error) {
    console.error("Request return error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit return request",
      error: error.message,
    });
  }
};

// -- GET MY RETURNS (BUYER)
exports.getMyReturns = async (req, res) => {
  try {
    const returns = await Return.find({ buyer: req.user._id })
      .populate("order", "orderItems totalPrice orderStatus")
      .populate("items.product", "title images")
      .populate("seller", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Returns fetched successfully",
      count: returns.length,
      data: returns,
    });
  } catch (error) {
    console.error("Get returns error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch returns",
      error: error.message,
    });
  }
};

// -- GET RETURN BY ID
exports.getReturnById = async (req, res) => {
  try {
    const returnRequest = await Return.findById(req.params.returnId)
      .populate("order")
      .populate("buyer", "name email")
      .populate("seller", "name email")
      .populate("items.product", "title images");

    if (!returnRequest) {
      return res.status(404).json({
        success: false,
        message: "Return request not found",
      });
    }

    // Authorization: buyer, seller, or admin can view
    const isBuyer = returnRequest.buyer._id.toString() === req.user._id.toString();
    const isSeller = returnRequest.seller._id.toString() === req.user._id.toString();
    const isAdmin = req.user.email === "admin@marketplace.com";

    if (!isBuyer && !isSeller && !isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied" 
      });
    }

    res.status(200).json({
      success: true,
      message: "Return details retrieved successfully",
      data: returnRequest,
    });
  } catch (error) {
    console.error("Get return by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch return details",
      error: error.message,
    });
  }
};

// -- GET SELLER'S RETURNS (SELLER/ADMIN access)
exports.getSellerReturns = async (req, res) => {
  try {
    const { status } = req.query;

    const filter = { seller: req.user._id };
    if (status) {
      filter.status = status;
    }

    const returns = await Return.find(filter)
      .populate("order", "orderItems totalPrice orderStatus")
      .populate("buyer", "name email")
      .populate("items.product", "title images")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Seller returns fetched successfully",
      count: returns.length,
      data: returns,
    });
  } catch (error) {
    console.error("Get seller returns error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch seller returns",
      error: error.message,
    });
  }
};

// -- APPROVE RETURN & PROCESS REFUND (SELLER/ADMIN)
exports.approveReturn = async (req, res) => {
  try {
    const { returnId } = req.params;

    const returnRequest = await Return.findById(returnId)
      .populate("order")
      .populate("items.product");

    if (!returnRequest) {
      return res.status(404).json({
        success: false,
        message: "Return request not found",
      });
    }

    // Authorization check
    const isAdmin = req.user.email === "admin@marketplace.com";
    const isSeller = returnRequest.seller.toString() === req.user._id.toString();

    if (!isAdmin && !isSeller) {
      return res.status(403).json({
        success: false,
        message: "Only seller or admin can approve returns",
      });
    }

    // Imp. Check: Verify seller owns all products
    if (isSeller && !isAdmin) {
      for (const item of returnRequest.items) {
        if (item.product.sellerId.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: `Authorization error: You don't own product "${item.name}"`,
          });
        }
      }
    }

    if (returnRequest.status !== "Requested") {
      return res.status(400).json({
        success: false,
        message: `Return is already ${returnRequest.status.toLowerCase()}`,
      });
    }

    // Update return status to Approved
    returnRequest.status = "Approved";
    await returnRequest.save();

    // We use CENTRALIZED REFUND FUNCTION and Process refund using the helper function from paymentController
    const refundResult = await processRefund(
      returnRequest.order._id,
      returnRequest.buyer, // Pass buyer ID for authorization
      returnRequest.refundAmount,
      `Return approved - ${returnRequest.reason}`
    );

    if (!refundResult.success) {
      // Refund failed - revert return status
      returnRequest.status = "Requested";
      await returnRequest.save();

      return res.status(refundResult.statusCode || 500).json({
        success: false,
        message: "Return approved but refund failed",
        error: refundResult.message,
      });
    }

    // Update return status to Completed
    returnRequest.status = "Completed";
    await returnRequest.save();

    // UPDATE ORDER STATUS
    // Check all returns for this order
    const allReturns = await Return.find({ order: returnRequest.order._id });

    const allCompleted = allReturns.every((r) =>
      ["Completed", "Rejected"].includes(r.status)
    );
    const hasCompleted = allReturns.some((r) => r.status === "Completed");

    const order = await Order.findById(returnRequest.order._id);

    if (allCompleted && hasCompleted) {
      // Check if ALL items from order are returned
      const returnedProductMap = new Map();

      allReturns
        .filter((r) => r.status === "Completed")
        .forEach((ret) => {
          ret.items.forEach((item) => {
            const key = item.product.toString();
            const existing = returnedProductMap.get(key) || 0;
            returnedProductMap.set(key, existing + item.quantity);
          });
        });

      let allItemsFullyReturned = true;
      for (const orderItem of order.orderItems) {
        const returnedQty =
          returnedProductMap.get(orderItem.product.toString()) || 0;
        if (returnedQty < orderItem.quantity) {
          allItemsFullyReturned = false;
          break;
        }
      }

      order.orderStatus = allItemsFullyReturned
        ? "Refunded"
        : "Partially Refunded";
    } else if (hasCompleted) {
      order.orderStatus = "Partially Refunded";
    }

    await order.save();

    // Note: STOCK RESTORATION is already done by processRefund function. Hence, not required separately here.

    res.status(200).json({
      success: true,
      message: "Return approved and refund processed successfully",
      data: {
        returnRequest,
        refund: refundResult.data,
        orderStatus: order.orderStatus,
      },
    });
  } catch (error) {
    console.error("Approve return error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve return",
      error: error.message,
    });
  }
};

// -- REJECT RETURN (SELLER/ADMIN)
exports.rejectReturn = async (req, res) => {
  try {
    const { error } = rejectReturnSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        error: error.details[0].message,
      });
    }

    const { returnId } = req.params;
    const { rejectionReason } = req.body;

    const returnRequest = await Return.findById(returnId)
      .populate("items.product");

    if (!returnRequest) {
      return res.status(404).json({
        success: false,
        message: "Return request not found",
      });
    }

    // Authorization check
    const isAdmin = req.user.email === "admin@marketplace.com";
    const isSeller = returnRequest.seller.toString() === req.user._id.toString();

    if (!isAdmin && !isSeller) {
      return res.status(403).json({
        success: false,
        message: "Only seller or admin can reject returns",
      });
    }

    // CHECK: Verifying seller owns all products
    if (isSeller && !isAdmin) {
      for (const item of returnRequest.items) {
        if (item.product.sellerId.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: `Authorization error: You don't own product "${item.name}"`,
          });
        }
      }
    }

    if (returnRequest.status !== "Requested") {
      return res.status(400).json({
        success: false,
        message: `Cannot reject return that is ${returnRequest.status.toLowerCase()}`,
      });
    }

    // Update return status to Rejected
    returnRequest.status = "Rejected";
    returnRequest.rejectionReason = rejectionReason || "No reason provided";
    await returnRequest.save();

    // Check if there are other pending/approved returns for this order
    const otherActiveReturns = await Return.find({
      order: returnRequest.order,
      _id: { $ne: returnRequest._id },
      status: { $in: ["Requested", "Approved", "Completed"] },
    });

    // we revert order to "Delivered" only if no other active returns exist
    if (otherActiveReturns.length === 0) {
      const order = await Order.findById(returnRequest.order);
      
      // If order was "Returned", revert to "Delivered"
      if (order.orderStatus === "Returned") {
        order.orderStatus = "Delivered";
        await order.save();
      }
    }

    res.status(200).json({
      success: true,
      message: "Return request rejected",
      data: returnRequest,
    });
  } catch (error) {
    console.error("Reject return error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject return",
      error: error.message,
    });
  }
};

// -- GET RETURNS BY ORDER ID (BUYER/SELLER/ADMIN)
exports.getReturnsByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Authorization
    const isBuyer = order.buyer.toString() === req.user._id.toString();
    const isAdmin = req.user.email === "admin@marketplace.com";
    
    // For sellers, check if they have any products in this order
    let isSeller = false;
    if (!isBuyer && !isAdmin) {
      const orderWithProducts = await Order.findById(orderId)
        .populate("orderItems.product");
      
      isSeller = orderWithProducts.orderItems.some(item => 
        item.product.sellerId.toString() === req.user._id.toString()
      );
    }

    if (!isBuyer && !isSeller && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const returns = await Return.find({ order: orderId })
      .populate("buyer", "name email")
      .populate("seller", "name email")
      .populate("items.product", "title images")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Returns for order fetched successfully",
      count: returns.length,
      data: returns,
    });
  } catch (error) {
    console.error("Get returns by order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch returns for order",
      error: error.message,
    });
  }
};