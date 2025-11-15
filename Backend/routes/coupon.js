const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middlewares/auth');
const couponController = require('../controllers/couponController');

router.post('/apply', protect, couponController.applyCoupon);
router.get('/', couponController.getCoupons);
router.post('/', protect, isAdmin, couponController.createCoupon);
router.put('/:id', protect, isAdmin, couponController.updateCoupon);
router.delete('/:id', protect, isAdmin, couponController.deleteCoupon);

module.exports = router;