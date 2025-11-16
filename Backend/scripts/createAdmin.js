require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/user");

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.ATLASDB_URL);
    console.log("✅ Connected to MongoDB");

    // Admin credentials
    const adminEmail = "admin@marketplace.com";
    const adminPassword = "Admin1"; // Change this to a strong password
    const adminName = "Market Connect Admin";

    // Check if admin already exists
    let admin = await User.findOne({ email: adminEmail });
    
    if (admin) {
      console.log("⚠️ Admin user already exists:", adminEmail);
      
      // Update password if needed
      admin.password = adminPassword;
      admin.name = adminName;
      admin.role = "admin";
      admin.mobNo = "9999999999"; // Valid Indian phone number format
      await admin.save();
      console.log("✅ Admin user updated");
    } else {
      // Create new admin
      admin = new User({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        role: "admin",
        mobNo: "9999999999", // Valid Indian phone number format
      });
      
      await admin.save();
      console.log("✅ Admin user created successfully!");
      console.log("📧 Email:", adminEmail);
      console.log("🔐 Password:", adminPassword);
    }

    // Verify by fetching
    const verifyAdmin = await User.findOne({ email: adminEmail }).select("+password");
    if (verifyAdmin) {
      console.log("✅ Verification: Admin found in database");
      console.log("   Name:", verifyAdmin.name);
      console.log("   Email:", verifyAdmin.email);
      console.log("   Role:", verifyAdmin.role);
    }

    await mongoose.connection.close();
    console.log("✅ Database connection closed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin:", error.message);
    process.exit(1);
  }
};

createAdmin();
