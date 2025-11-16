const User = require("../models/user");
const Product = require("../models/product");
const { addToCartSchema, updateCartSchema } = require("../validations/cart");
const Joi = require("joi");

const itemIdSchema = Joi.string().hex().length(24).required().messages({
  'string.hex': 'Item ID must be a valid MongoDB ID',
  'string.length': 'Item ID must be 24 characters long',
  'any.required': 'Item ID is required'
});

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
      const currentPrice = item.productId.price;
      const itemTotal = currentPrice * item.quantity;
      
      return {
        _id: item._id,
        productId: item.productId._id,
        quantity: item.quantity,
        addedAt: item.addedAt,
        productDetails: {
          _id: item.productId._id,
          title: item.productId.title,
          images: item.productId.images,
          price: item.productId.price,
          stock: item.productId.stock,
          sellerId: item.productId.sellerId
        },
        currentPrice: currentPrice,
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

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    if (product.isAuction && product.auctionDetails.status === 'Active') {
  return res.status(400).json({
    success: false,
    message: "This item is currently in an active auction and cannot be added to cart."
  });
}

    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} items available in stock`
      });
    }

    if (product.sellerId.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "Cannot add your own product to cart"
      });
    }

    const existingCartItem = user.buyerInfo.cart.find(
      item => item.productId.toString() === productId
    );

    if (existingCartItem) {
      const newQuantity = existingCartItem.quantity + quantity;
      
      if (product.stock < newQuantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} items available. You already have ${existingCartItem.quantity} in cart`
        });
      }
      
      existingCartItem.quantity = newQuantity;
    } else {
      user.buyerInfo.cart.push({
        productId: productId,
        quantity: quantity,
        addedAt: new Date()
      });
    }

    await user.save();
    
    const updatedUser = await User.findById(req.user._id)
      .populate('buyerInfo.cart.productId', 'title images price stock sellerId');

    const formattedCart = updatedUser.buyerInfo.cart.map(item => ({
      _id: item._id,
      productId: item.productId._id,
      quantity: item.quantity,
      addedAt: item.addedAt,
      productDetails: {
        title: item.productId.title,
        images: item.productId.images,
        price: item.productId.price,
        stock: item.productId.stock
      },
      currentPrice: item.productId.price,
      itemTotal: item.productId.price * item.quantity
    }));

    res.status(200).json({
      success: true,
      message: existingCartItem ? "Item quantity updated in cart" : "Item added to cart",
      data: formattedCart
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
    const { error: paramError } = itemIdSchema.validate(req.params.itemId);
    if (paramError) {
      return res.status(400).json({
        success: false,
        message: "Invalid item ID",
        error: paramError.details[0].message
      });
    }

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

    const product = await Product.findById(cartItem.productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} items available in stock`
      });
    }

    cartItem.quantity = quantity;
    await user.save();
    
    const updatedUser = await User.findById(req.user._id)
      .populate('buyerInfo.cart.productId', 'title images price stock sellerId');

    const formattedCart = updatedUser.buyerInfo.cart.map(item => ({
      _id: item._id,
      productId: item.productId._id,
      quantity: item.quantity,
      addedAt: item.addedAt,
      productDetails: {
        title: item.productId.title,
        images: item.productId.images,
        price: item.productId.price,
        stock: item.productId.stock
      },
      currentPrice: item.productId.price,
      itemTotal: item.productId.price * item.quantity
    }));

    res.json({
      success: true,
      message: "Cart item updated",
      data: formattedCart
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

    const { error: paramError } = itemIdSchema.validate(req.params.itemId);
    if (paramError) {
      return res.status(400).json({
        success: false,
        message: "Invalid item ID",
        error: paramError.details[0].message
      });
    }

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
    
    const updatedUser = await User.findById(req.user._id)
      .populate('buyerInfo.cart.productId', 'title images price stock sellerId');

    const formattedCart = updatedUser.buyerInfo.cart.map(item => ({
      _id: item._id,
      productId: item.productId._id,
      quantity: item.quantity,
      addedAt: item.addedAt,
      productDetails: {
        title: item.productId.title,
        images: item.productId.images,
        price: item.productId.price,
        stock: item.productId.stock
      },
      currentPrice: item.productId.price,
      itemTotal: item.productId.price * item.quantity
    }));

    res.json({
      success: true,
      message: "Item removed from cart",
      data: formattedCart
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