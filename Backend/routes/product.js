const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const upload = require("../middlewares/multer");
const validate = require("../middlewares/validateSchema");
const {
  createProductSchema,
  updateProductSchema,
} = require("../validations/product");
const { protect, isSeller, isOwner } = require("../middlewares/auth");

//public routes
router.get("/products", productController.getAllProducts);
router.get("/products/compare", productController.compareProducts); // Must come before :id routes
router.get('/products/suggestions', productController.getProductSuggestions);
router.get("/products/:id/similar", productController.getSimilarProducts); // Specific routes before generic :id
router.get("/products/:id", productController.getProductById);

//protected(Seller as a user)
router.post(
  "/products",
  protect,
  isSeller,
  upload.array("images", 5), //5 max files allowed
  validate(createProductSchema),
  productController.createProduct
);

router.put(
  "/products/:id",
  protect,
  isSeller,
  isOwner,
  upload.array("images", 5), //5 max files allowed
  validate(updateProductSchema),
  productController.updateProduct
);

router.delete(
  "/products/:id",
  protect,
  isSeller,
  isOwner,
  productController.deleteProduct
);

module.exports = router;