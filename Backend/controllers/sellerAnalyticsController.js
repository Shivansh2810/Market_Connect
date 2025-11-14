const Order = require('../models/order');
const Product = require('../models/product');
const mongoose = require('mongoose');

exports.getSellerStats = async (req, res) => {
    try {
        const sellerId = new mongoose.Types.ObjectId(req.user._id);

        const salesData = await Order.aggregate([
            { $match: { seller: sellerId, orderStatus: "Delivered" } },
            { $group: { 
                _id: null, 
                totalRevenue: { $sum: "$totalPrice" }, 
                totalSales: { $sum: 1 } 
            }}
        ]);

        const pendingOrders = await Order.countDocuments({ 
            seller: sellerId, 
            orderStatus: { $in: ["Processing", "Shipped"] } 
        });

        const totalProducts = await Product.countDocuments({ 
            sellerId: sellerId, 
            isDeleted: false 
        });

        const avgRatingData = await Product.aggregate([
            { $match: { sellerId: sellerId, isDeleted: false, ratingCount: { $gt: 0 } } },
            { $group: { 
                _id: null, 
                avgRating: { $avg: "$ratingAvg" } 
            }}
        ]);

        res.json({
            success: true,
            data: {
                totalRevenue: salesData[0]?.totalRevenue || 0,
                totalSales: salesData[0]?.totalSales || 0,
                pendingOrders,
                totalProducts,
                averageRating: avgRatingData[0]?.avgRating.toFixed(1) || 0
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

exports.getSalesReport = async (req, res) => {
    try {
        const sellerId = new mongoose.Types.ObjectId(req.user._id);
        
        //last 30 days data taken into account
        const salesReport = await Order.aggregate([
            { $match: { 
                seller: sellerId, 
                orderStatus: "Delivered",
                createdAt: { $gte: new Date(new Date().setDate(new Date().getDate() - 30)) }
            }},
            { $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                totalSales: { $sum: "$totalPrice" }
            }},
            { $sort: { _id: 1 } } 
        ]);

        res.json({ success: true, data: salesReport });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};
exports.getProductPerformance = async (req, res) => {
    try {
        const sellerId = req.user._id;
        
        const products = await Product.find({ sellerId: sellerId, isDeleted: false })
            .select('title stock price ratingAvg ratingCount images condition')
            .sort({ createdAt: -1 });

        res.json({ success: true, data: products });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};