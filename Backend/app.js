require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const cors = require("cors");
const userRouter = require("./routes/user");
require("./config/passport"); // Google strategy

const app = express();

mongoose.connect(process.env.ATLASDB_URL)
  .then(() => console.log("MongoDB Atlas connected"))
  .catch(err => console.error("DB connection error:", err));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

app.get("/", (req, res) => res.json({ message: "Server running" }));
app.use("/", userRouter);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
