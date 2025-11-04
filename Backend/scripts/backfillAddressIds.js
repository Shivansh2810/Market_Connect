require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/user");

async function run() {
  await mongoose.connect(process.env.ATLASDB_URL, {});
  console.log("Connected to DB");

  const cursor = User.find({
    "buyerInfo.shippingAddresses.0": { $exists: true },
  }).cursor();
  let usersProcessed = 0;
  let addressesUpdated = 0;

  for (
    let user = await cursor.next();
    user != null;
    user = await cursor.next()
  ) {
    let modified = false;
    if (user.buyerInfo && Array.isArray(user.buyerInfo.shippingAddresses)) {
      user.buyerInfo.shippingAddresses.forEach((addr) => {
        if (!addr._id) {
          addr._id = new mongoose.Types.ObjectId();
          addressesUpdated += 1;
          modified = true;
        }
      });
    }

    if (modified) {
      await user.save();
      usersProcessed += 1;
      console.log(`Updated user ${user._id}`);
    }
  }

  console.log(
    `Done. Users processed: ${usersProcessed}. Addresses updated: ${addressesUpdated}`
  );
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
