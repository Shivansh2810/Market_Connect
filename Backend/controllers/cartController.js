const User = require("../models/user");
const Product = require("../models/product");
const { addToCartSchema, updateCartSchema } = require("../validations/cart");

const getCart = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('buyerInfo.cart.productId', 'title images price stock sellerId');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const cartItems = user.buyerInfo.cart || [];

    const cartWithTotals = cartItems.map(item => {
      const itemTotal = item.price * item.quantity;
      return {
        ...item.toObject(),
        itemTotal: itemTotal
      };
    });

    const subtotal = cartWithTotals.reduce((total, item) => total + item.itemTotal, 0);
    const totalItems = cartWithTotals.reduce((total, item) => total + item.quantity, 0);

    res.json({
      success: true,
      message: "Cart retrieved successfully",
      data: {
        items: cartWithTotals,
        summary: {
          subtotal,
          totalItems,
          totalItemsCount: cartWithTotals.length
        }
      }
    });

  } catch (error) {
    console.error("Get cart error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get cart",
      error: error.message
    });
  }
};

const addToCart = async (req, res) => {
  try {
    const { error, value } = addToCartSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid data",
        error: error.details[0].message
      });
    }

    const { productId, quantity } = value;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const existingCartItem = user.buyerInfo.cart.find(
      item => item.productId.toString() === productId
    );

    if (existingCartItem) {
      existingCartItem.quantity += quantity;
    } else {
      user.buyerInfo.cart.push({
        productId: productId,
        quantity: quantity,
        price: 1000,
        addedAt: new Date()
      });
    }

    await user.save();
    await user.populate('buyerInfo.cart.productId', 'title images price stock');

    res.status(200).json({
      success: true,
      message: existingCartItem ? "Item quantity updated in cart" : "Item added to cart",
      data: user.buyerInfo.cart
    });

  } catch (error) {
    console.error("Add to cart error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add item to cart",
      error: error.message
    });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    
    const { error, value } = updateCartSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid quantity",
        error: error.details[0].message
      });
    }

    const { quantity } = value;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const cartItem = user.buyerInfo.cart.id(itemId);
    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart"
      });
    }

    cartItem.quantity = quantity;
    await user.save();
    await user.populate('buyerInfo.cart.productId', 'title images price stock');

    res.json({
      success: true,
      message: "Cart item updated",
      data: user.buyerInfo.cart
    });

  } catch (error) {
    console.error("Update cart item error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update cart item",
      error: error.message
    });
  }
};

const removeCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    user.buyerInfo.cart = user.buyerInfo.cart.filter(
      item => item._id.toString() !== itemId
    );

    await user.save();
    await user.populate('buyerInfo.cart.productId', 'title images price stock');

    res.json({
      success: true,
      message: "Item removed from cart",
      data: user.buyerInfo.cart
    });

  } catch (error) {
    console.error("Remove cart item error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove item from cart",
      error: error.message
    });
  }
};

const clearCart = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    user.buyerInfo.cart = [];
    await user.save();

    res.json({
      success: true,
      message: "Cart cleared",
      data: []
    });

  } catch (error) {
    console.error("Clear cart error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to clear cart",
      error: error.message
    });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart
};