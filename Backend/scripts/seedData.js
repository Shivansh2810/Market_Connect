require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/user");
const Product = require("../models/product");
const Category = require("../models/category");
const Order = require("../models/order");

// Sample data
const sampleCategories = [
  {
    name: "Electronics",
    slug: "electronics"
  },
  {
    name: "Fashion",
    slug: "fashion"
  },
  {
    name: "Home & Kitchen",
    slug: "home-kitchen"
  },
  {
    name: "Books",
    slug: "books"
  },
  {
    name: "Sports",
    slug: "sports"
  }
];

const sampleProducts = [
  {
    title: "Wireless Bluetooth Headphones",
    description: "High-quality wireless headphones with noise cancellation and 30-hour battery life.",
    price: 1299,
    currency: "INR",
    stock: 25,
    condition: "new",
    tags: ["electronics", "audio", "wireless", "bluetooth"],
    specs: {
      "Battery Life": "30 hours",
      "Connectivity": "Bluetooth 5.0",
      "Noise Cancellation": "Yes",
      "Color": "Black"
    }
  },
  {
    title: "Smart Fitness Watch",
    description: "Advanced fitness tracker with heart rate monitoring, GPS, and smartphone notifications.",
    price: 2499,
    currency: "INR",
    stock: 15,
    condition: "new",
    tags: ["electronics", "fitness", "smartwatch", "health"],
    specs: {
      "Display": "1.3 inch AMOLED",
      "Battery": "7 days",
      "Water Resistance": "5 ATM",
      "GPS": "Built-in"
    }
  },
  {
    title: "Organic Cotton T-Shirt",
    description: "Comfortable and eco-friendly organic cotton t-shirt available in multiple colors.",
    price: 399,
    currency: "INR",
    stock: 50,
    condition: "new",
    tags: ["fashion", "clothing", "cotton", "casual"],
    specs: {
      "Material": "100% Organic Cotton",
      "Fit": "Regular",
      "Care": "Machine Wash",
      "Sizes": "S, M, L, XL"
    }
  },
  {
    title: "Premium Coffee Beans",
    description: "Freshly roasted Arabica coffee beans from premium estates.",
    price: 349,
    currency: "INR",
    stock: 30,
    condition: "new",
    tags: ["food", "beverages", "coffee", "gourmet"],
    specs: {
      "Type": "Arabica",
      "Roast": "Medium",
      "Weight": "250g",
      "Origin": "India"
    }
  },
  {
    title: "Leather Wallet",
    description: "Genuine leather wallet with multiple card slots and cash compartment.",
    price: 1199,
    currency: "INR",
    stock: 20,
    condition: "new",
    tags: ["fashion", "accessories", "leather", "wallet"],
    specs: {
      "Material": "Genuine Leather",
      "Color": "Brown",
      "Card Slots": "8",
      "Style": "Bifold"
    }
  },
  {
    title: "Wired Headphone",
    description: "High-quality wired headphones with superior sound quality and comfortable fit.",
    price: 899,
    currency: "INR",
    stock: 35,
    condition: "new",
    tags: ["electronics", "audio", "wired", "music"],
    specs: {
      "Driver Size": "40mm",
      "Impedance": "32 ohms",
      "Cable Length": "1.2m",
      "Connectivity": "3.5mm jack"
    }
  },
  {
    title: "Yoga Mat",
    description: "Non-slip yoga mat with excellent cushioning for comfortable workouts.",
    price: 599,
    currency: "INR",
    stock: 40,
    condition: "new",
    tags: ["sports", "fitness", "yoga", "exercise"],
    specs: {
      "Material": "TPE",
      "Thickness": "6mm",
      "Size": "183cm x 61cm",
      "Weight": "1.2kg"
    }
  },
  {
    title: "Cookware Set",
    description: "10-piece non-stick cookware set for your kitchen needs.",
    price: 1899,
    currency: "INR",
    stock: 12,
    condition: "new",
    tags: ["home", "kitchen", "cookware", "non-stick"],
    specs: {
      "Pieces": "10",
      "Material": "Aluminum",
      "Coating": "Non-stick",
      "Includes": "Pans, Pots, Lids"
    }
  }
];

const sampleUsers = [
  {
    name: "Test Buyer",
    email: "buyer@test.com",
    password: "Test123!",
    mobNo: "9876543210",
    role: "buyer"
  },
  {
    name: "Test Seller",
    email: "seller@test.com", 
    password: "Test123!",
    mobNo: "9876543211",
    role: "seller",
    sellerInfo: {
      shopName: "Seller's Shop",
      shopAddress: {
        street: "123 Seller Street",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
        country: "India"
      }
    }
  },
  {
    name: "Admin User",
    email: "admin@marketplace.com",
    password: "Admin123!",
    mobNo: "9876543212",
    role: "admin"
  }
];

async function seedData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.ATLASDB_URL);
    console.log("✅ Connected to MongoDB");

    // Clear existing data
    console.log("🗑️ Clearing existing data...");
    await User.deleteMany({});
    await Product.deleteMany({});
    await Category.deleteMany({});
    await Order.deleteMany({});

    // Create categories
    console.log("📁 Creating categories...");
    const categories = await Category.insertMany(sampleCategories);
    console.log(`✅ Created ${categories.length} categories`);

    // Create users
    console.log("👥 Creating users...");
    const users = await User.insertMany(sampleUsers);
    console.log(`✅ Created ${users.length} users`);

    // Get seller user for product assignment
    const sellerUser = users.find(user => user.role === "seller");
    
    // Map categories by name for easy assignment
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.name.toLowerCase()] = cat._id;
    });

    // Assign categories and seller to products
    const productsWithData = sampleProducts.map(product => {
      let categoryId;
      
      // Assign category based on product type
      if (product.tags.includes("electronics")) {
        categoryId = categoryMap["electronics"];
      } else if (product.tags.includes("fashion")) {
        categoryId = categoryMap["fashion"];
      } else if (product.tags.includes("home") || product.tags.includes("kitchen")) {
        categoryId = categoryMap["home & kitchen"];
      } else if (product.tags.includes("sports") || product.tags.includes("fitness")) {
        categoryId = categoryMap["sports"];
      } else {
        categoryId = categoryMap["books"];
      }

      // Add sample images (using placeholder URLs)
      const images = [
        {
          url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop",
          publicId: "sample-headphones",
          isPrimary: true
        },
        {
          url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop", 
          publicId: "sample-watch",
          isPrimary: true
        },
        {
          url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=300&fit=crop",
          publicId: "sample-tshirt",
          isPrimary: true
        },
        {
          url: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=300&fit=crop",
          publicId: "sample-coffee",
          isPrimary: true
        },
        {
          url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop",
          publicId: "sample-wallet", 
          isPrimary: true
        },
        {
          url: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=300&fit=crop",
          publicId: "sample-wired-headphones",
          isPrimary: true
        },
        {
          url: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop",
          publicId: "sample-yoga-mat",
          isPrimary: true
        },
        {
          url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop",
          publicId: "sample-cookware",
          isPrimary: true
        }
      ];

      return {
        ...product,
        sellerId: sellerUser._id,
        categoryId: categoryId,
        images: [images[sampleProducts.indexOf(product)]],
        ratingAvg: Math.random() * 2 + 3, // Random rating between 3-5
        ratingCount: Math.floor(Math.random() * 100) + 10 // Random count 10-110
      };
    });

    // Create products
    console.log("📦 Creating products...");
    const products = await Product.insertMany(productsWithData);
    console.log(`✅ Created ${products.length} products`);

    console.log("🎉 Database seeded successfully!");
    console.log("\n📋 Sample Data Created:");
    console.log(`   👥 Users: ${users.length}`);
    console.log(`   📁 Categories: ${categories.length}`); 
    console.log(`   📦 Products: ${products.length}`);
    
    console.log("\n🔑 Test Credentials:");
    console.log("   Buyer: buyer@test.com / Test123!");
    console.log("   Seller: seller@test.com / Test123!");
    console.log("   Admin: admin@marketplace.com / Admin123!");

  } catch (error) {
    console.error("❌ Error seeding data:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
    process.exit(0);
  }
}

// Run the seed function
seedData();