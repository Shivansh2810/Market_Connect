require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/user");
const Product = require("../models/product");
const Category = require("../models/category");

async function checkDatabase() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.ATLASDB_URL);
    console.log("✅ Connected to MongoDB Atlas\n");

    // Check Users
    const userCount = await User.countDocuments();
    console.log(`👥 Users in database: ${userCount}`);
    
    if (userCount > 0) {
      const users = await User.find().select("name email role").limit(5);
      console.log("Sample users:");
      users.forEach(user => {
        console.log(`  - ${user.name} (${user.email}) - Role: ${user.role}`);
      });
    }
    console.log("");

    // Check Categories
    const categoryCount = await Category.countDocuments();
    console.log(`📁 Categories in database: ${categoryCount}`);
    
    if (categoryCount > 0) {
      const categories = await Category.find().select("name");
      console.log("Categories:");
      categories.forEach(cat => {
        console.log(`  - ${cat.name} (ID: ${cat._id})`);
      });
    } else {
      console.log("⚠️  No categories found! Products need categories.");
    }
    console.log("");

    // Check Products
    const productCount = await Product.countDocuments();
    const activeProductCount = await Product.countDocuments({ isDeleted: false });
    console.log(`📦 Total products in database: ${productCount}`);
    console.log(`📦 Active products: ${activeProductCount}`);
    
    if (productCount > 0) {
      const products = await Product.find({ isDeleted: false })
        .populate("categoryId", "name")
        .populate("sellerId", "name email")
        .limit(5);
      
      console.log("Sample products:");
      products.forEach(product => {
        console.log(`  - ${product.title}`);
        console.log(`    Price: ₹${product.price}`);
        console.log(`    Category: ${product.categoryId?.name || 'N/A'}`);
        console.log(`    Seller: ${product.sellerId?.name || 'N/A'}`);
        console.log(`    Stock: ${product.stock}`);
        console.log("");
      });
    } else {
      console.log("⚠️  No products found! Database is empty.");
    }

    // Check for deleted products
    const deletedCount = await Product.countDocuments({ isDeleted: true });
    if (deletedCount > 0) {
      console.log(`🗑️  Deleted products: ${deletedCount}`);
    }

    console.log("\n✅ Database check complete!");
    
  } catch (error) {
    console.error("❌ Error checking database:", error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 Database connection closed");
  }
}

checkDatabase();
