require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const cors = require("cors");

const userRoutes = require("./routes/user");
require("./auth/googleAuth.js"); // Google OAuth setup

const app = express();

// ------------------ DATABASE CONNECTION ------------------
mongoose
  .connect(process.env.MONGO_DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connection established"))
  .catch((err) => console.error("MongoDB connection failed:", err.message));

// ------------------ MIDDLEWARES ------------------
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded data
app.use(passport.initialize()); // Initialize passport for OAuth

// ------------------ ROUTES ------------------
app.get("/", (req, res) => {
  res.json({ message: "Server is running" });
});

// User-related routes (signup, login, Google Auth)
app.use("/", userRoutes);

// ------------------ START SERVER ------------------
const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
