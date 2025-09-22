require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const cors = require("cors");

const User = require("./models/user");
const userRouter = require("./routes/user");

const app = express();
const dbUrl = process.env.MONGO_DB_URL;

async function main() {
  try {
    await mongoose.connect(dbUrl);
    console.log("connection successful");
  } catch (err) {
    console.error("DB connection error:", err);
  }
}

main();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

passport.use(
  new LocalStrategy({ usernameField: "email" }, User.authenticate())
);

app.use("/", userRouter);

app.listen(8080, () => {
  console.log("App is listening on port 8080");
});