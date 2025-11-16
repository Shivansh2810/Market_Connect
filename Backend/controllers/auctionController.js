const Product = require('../models/product');

exports.createAuction = async (req, res) => {
    try {
        const { productId, startTime, endTime, startPrice } = req.body;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found." });
        }
        if (product.isAuction) {
            return res.status(400).json({ message: "This product is already an auction item." });
        }

        product.isAuction = true;
        product.auctionDetails = {
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            startPrice: startPrice,
            currentBid: startPrice,
            status: 'Pending' //active when startTime reached
        };
        
        product.sellerId = req.user._id; 

        await product.save();
        res.status(201).json({ success: true, message: "Auction created successfully", product });

    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

exports.getActiveAuctions = async (req, res) => {
    try {
        const now = new Date();
        const auctions = await Product.find({
            isAuction: true,
            'auctionDetails.status': 'Active',
            'auctionDetails.endTime': { $gt: now }
        })
        .populate('sellerId', 'name')
        .sort({ 'auctionDetails.endTime': 1 }); 

        res.status(200).json({ success: true, data: auctions });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

exports.getAuctionById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('sellerId', 'name')
            .populate({
                path: 'auctionDetails.bidHistory',
                populate: { path: 'user', select: 'name' },
                options: { sort: { createdAt: -1 } } 
            });

        if (!product || !product.isAuction) {
            return res.status(404).json({ message: "Auction product not found." });
        }
        
        res.status(200).json({ success: true, data: product });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

//update end-time
exports.updateAuction = async (req, res) => {
    try {
        const { endTime } = req.body;
        const product = await Product.findById(req.params.id);

        if (!product || !product.isAuction) {
            return res.status(404).json({ message: "Auction product not found." });
        }
        
        if (endTime) product.auctionDetails.endTime = new Date(endTime);

        await product.save();
        res.status(200).json({ success: true, message: "Auction updated.", data: product });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

exports.cancelAuction = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product || !product.isAuction) {
            return res.status(404).json({ message: "Auction product not found." });
        }

        product.auctionDetails.status = 'Cancelled';
        await product.save();
        
        res.status(200).json({ success: true, message: "Auction cancelled." });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};