const Product = require('../models/product');
const Bid = require('../models/bids');

exports.createAuction = async (req, res) => {
    try {
        const { 
            title, 
            description, 
            categoryId,
            images,
            price,
            condition,
            stock,
            specs,
            startTime, 
            endTime, 
            startPrice 
        } = req.body;

        // Validate required fields
        if (!title || !description || !categoryId || !startTime || !endTime || !startPrice) {
            return res.status(400).json({ 
                message: "Missing required fields: title, description, categoryId, startTime, endTime, startPrice" 
            });
        }

        const now = new Date();
        const startDate = new Date(startTime);
        const endDate = new Date(endTime);

        if (startDate >= endDate) {
            return res.status(400).json({ message: "Start time must be before end time" });
        }

        // Determine initial status based on start time
        let initialStatus = 'Pending';
        if (startDate <= now && endDate > now) {
            initialStatus = 'Active';
        }

        // Create new product with auction details
        const newProduct = new Product({
            title,
            description,
            categoryId,
            images: images || [],
            price: price || 0,
            condition: condition || 'new',
            stock: stock || 1,
            specs: specs || {},
            sellerId: req.user._id, // Admin creating the auction
            isAuction: true,
            auctionDetails: {
                startTime: startDate,
                endTime: endDate,
                startPrice: parseFloat(startPrice),
                currentBid: parseFloat(startPrice),
                minIncrement: 1,
                bidHistory: [],
                highestBidder: null,
                status: initialStatus
            }
        });

        const savedProduct = await newProduct.save();
        const populatedProduct = await Product.findById(savedProduct._id)
            .populate('sellerId', 'name')
            .populate('categoryId', 'name');

        res.status(201).json({ 
            success: true, 
            message: "Auction created successfully", 
            data: populatedProduct 
        });

    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};
exports.getActiveAuctions = async (req, res) => {
    try {
        const now = new Date();
        const auctions = await Product.find({
            isAuction: true,
            'auctionDetails.endTime': { $gt: now }
        })
        .populate('sellerId', 'name')
        .populate({
            path: 'auctionDetails.highestBidder',
            select: 'name email'
        })
        .populate({
            path: 'auctionDetails.bidHistory',
            populate: { path: 'user', select: 'name' }
        })
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
            .populate('auctionDetails.highestBidder', 'name email')
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

//Get all auctions (admin view - including pending and cancelled)
exports.getAllAuctionsAdmin = async (req, res) => {
    try {
        const auctions = await Product.find({ isAuction: true })
            .populate('sellerId', 'name')
            .populate('auctionDetails.highestBidder', 'name email')
            .populate({
                path: 'auctionDetails.bidHistory',
                populate: { path: 'user', select: 'name' }
            })
            .sort({ 'auctionDetails.startTime': -1 }); 

        res.status(200).json({ success: true, data: auctions });
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

        // Delete the auction completely
        await Product.findByIdAndDelete(req.params.id);
        
        res.status(200).json({ success: true, message: "Auction cancelled and deleted." });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};