const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const validate = require('../middlewares/validateSchema');
const { createCategorySchema, updateCategorySchema } = require('../validations/category');
const { protect, isAdmin } = require('../middlewares/auth'); 

router.get('/categories', categoryController.getAllCategories);
router.get('/categories/:id', categoryController.getCategoryById);

//only admin can add categories
router.post(
    '/categories',
    protect,
    isAdmin, 
    validate(createCategorySchema),
    categoryController.createCategory
);

//update a category
router.put(
    '/categories/:id',
    protect,
    isAdmin, 
    validate(updateCategorySchema),
    categoryController.updateCategory
);

//Delete a category
router.delete(
    '/categories/:id',
    protect,
    isAdmin,
    categoryController.deleteCategory
);

module.exports = router;