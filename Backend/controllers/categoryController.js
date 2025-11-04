const Category = require('../models/category');
const Product = require('../models/product'); 

exports.createCategory = async (req, res) => {
    try {
        const { name, parentId } = req.body;

        const existingCategory = await Category.findOne({ 
            name: { $regex: new RegExp(`^${name}$`, 'i') } 
        });

        if (existingCategory) {
            return res.status(400).json({ message: "A category with this name already exists." });
        }

        const category = await Category.create({
            name,
            parentId: parentId || null
        });

        res.status(201).json({ success: true, category });

    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};


exports.getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find({}).sort({ name: 1 });
        res.status(200).json({ success: true, categories });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

exports.getCategoryById = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.status(200).json({ success: true, category });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        
        if (req.body.name) {
            category.name = req.body.name;
        }
        if (req.body.parentId) {
            category.parentId = req.body.parentId;
        }

        //slug changes automatically by presave hook
        const updatedCategory = await category.save();

        res.status(200).json({ success: true, category: updatedCategory });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;

        const productCount = await Product.countDocuments({ categoryId: categoryId });
        if (productCount > 0) {
            return res.status(400).json({ 
                message: `Cannot delete this category. It is already being used by ${productCount} product(s).` 
            });
        }

        const childCategoryCount = await Category.countDocuments({ parentId: categoryId });
         if (childCategoryCount > 0) {
            return res.status(400).json({ 
                message: `Cannot delete this category. It is a parent to ${childCategoryCount} other categories.` 
            });
        }
        
        const category = await Category.findByIdAndDelete(categoryId);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        res.status(200).json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};