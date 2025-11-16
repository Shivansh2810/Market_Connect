require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/user");

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.ATLASDB_URL);
    console.log("✅ Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: "admin@marketplace.com" });
    
    if (existingAdmin) {
      console.log("⚠️  Admin user already exists!");
      console.log("Email:", existingAdmin.email);
      console.log("Role:", existingAdmin.role);
      
      // Update password if needed
      const updatePassword = process.argv[2] === '--update-password';
      if (updatePassword) {
        existingAdmin.password = "Admin123!";
        await existingAdmin.save();
        console.log("✅ Admin password updated to: Admin123!");
      } else {
        console.log("\nTo update password, run: node scripts/createAdmin.js --update-password");
      }
    } else {
      // Create new admin user
      const adminUser = new User({
        name: "Admin User",
        email: "admin@marketplace.com",
        password: "Admin123!",
        mobNo: "9876543212",
        role: "admin"
      });

      await adminUser.save();
      console.log("✅ Admin user created successfully!");
      console.log("\n🔑 Admin Credentials:");
      console.log("   Email: admin@marketplace.com");
      console.log("   Password: Admin123!");
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
    process.exit(0);
  }
}

createAdmin();
