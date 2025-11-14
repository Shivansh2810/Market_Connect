const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/sellerAnalyticsController');
const { protect, isSeller } = require('../middlewares/auth');

// Protected routes(Seller only)
router.use(protect, isSeller);

router.get('/seller/stats', analyticsController.getSellerStats);

router.get('/seller/salesreport', analyticsController.getSalesReport);

router.get('/seller/productsperformance', analyticsController.getProductPerformance);

module.exports = router;