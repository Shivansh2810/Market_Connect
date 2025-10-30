require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const cors = require("cors");

const userRoutes = require("./routes/user");
require("./auth/googleAuth.js"); 

const app = express();
const cartRoutes = require('./routes/cart');
const couponRoutes = require('./routes/coupon');

mongoose.connect(process.env.ATLASDB_URL)
  .then(() => console.log("MongoDB Atlas connected"))
  .catch(err => console.error("DB connection error:", err));

app.use(cors()); 
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 
app.use(passport.initialize()); 

app.use('/api/cart', cartRoutes);
app.use('/api/coupons', couponRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Server is running" });
});

app.use("/", userRoutes);

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
