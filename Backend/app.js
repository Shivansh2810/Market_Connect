
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const cors = require("cors");

const userRoutes = require("./routes/user");
require("./auth/googleAuth.js");

const app = express();
const cartRoutes = require("./routes/cart");
const couponRoutes = require("./routes/coupon");
const reviewRoutes = require("./routes/review");
const sellerRoutes = require("./routes/seller");
const orderRoutes = require("./routes/order");
const productRoutes = require("./routes/product");
const categoryRoutes = require("./routes/category");
const paymentRoutes = require("./routes/payment");

mongoose
  .connect(process.env.ATLASDB_URL)
  .then(() => console.log("MongoDB Atlas connected"))
  .catch((err) => console.error("DB connection error:", err));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

app.use("/api", productRoutes);
app.use("/api", categoryRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.get("/", (req, res) => {
  res.json({ message: "Server is running" });
});

app.use("/api", userRoutes);

// Export the app for testing. When run directly, start the server.
if (require.main === module) {
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
