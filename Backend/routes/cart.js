const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const cartController = require('../controllers/cartController');

router.get('/', protect, cartController.getCart);
router.post('/items', protect, cartController.addToCart);
router.put('/items/:itemId', protect, cartController.updateCartItem);
router.delete('/items/:itemId', protect, cartController.removeCartItem);
router.delete('/', protect, cartController.clearCart);

module.exports = router;