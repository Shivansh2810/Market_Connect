const Product = require('../models/product');
const { cloudinary } = require('../CloudConfig');

//new product
exports.createProduct = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: "Please upload at least one image." });
        }

        const images = req.files.map((f, index) => ({
            url: f.path,        //Cloudinary url
            publicId: f.filename, // The public_id (e.g., "Market-Connect/Products/image_name")
            isPrimary: index === 0 //First image primary
        }));

        const productData = {
            ...req.body,
            sellerId: req.user._id,
            images: images
        };

        const product = await Product.create(productData);
        res.status(200).json({ success: true, product });

    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

//browse products
exports.getAllProducts = async (req, res) => {
    try {
        const { keyword, category, minPrice, maxPrice, condition } = req.query;
        const query = { isDeleted: false };

        if (keyword) {
            query.$or = [
                { title: { $regex: keyword, $options: 'i' } },
                { description: { $regex: keyword, $options: 'i' } }
            ];
        }
        if (category) query.categoryId = category;
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }
        if (condition) query.condition = condition;

        // display in form of pages-lazy loading
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const products = await Product.find(query)
            .populate('categoryId', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const totalProducts = await Product.countDocuments(query);

        res.status(200).json({
            success: true,
            totalPages: Math.ceil(totalProducts / limit),
            currentPage: page,
            products
        });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

//find 1 product
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('sellerId', 'sellerInfo.shopName')
            .populate('categoryId', 'name');

        if (!product || product.isDeleted) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        res.status(200).json({ success: true, product });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

//update product
exports.updateProduct = async (req, res) => {
    try {
        const product = req.product;//isOwner has params attached with product found by ID
        
        product.set(req.body);

        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(f => ({
                url: f.path,
                publicId: f.filename
            }));
            product.images.push(...newImages);
        }

        if (req.body.imagesToDelete) {//imagesToDelete - publicIds of images to be deleted from frontend
            const publicIdsToDelete = Array.isArray(req.body.imagesToDelete) 
                ? req.body.imagesToDelete 
                : [req.body.imagesToDelete];

            for (let publicId of publicIdsToDelete) {
                await cloudinary.uploader.destroy(publicId);
            }

            product.images = product.images.filter(img => 
                !publicIdsToDelete.includes(img.publicId)
            );
        }

        const updatedProduct = await product.save();
        res.status(200).json({ success: true, product: updatedProduct });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

//delete product
exports.deleteProduct = async (req, res) => {
    try {
        const product = req.product;//isOwner has params attached with product found by ID

        //deleted product is still stored in db for future use if req
        product.isDeleted = true;
        await product.save();

        res.status(200).json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};