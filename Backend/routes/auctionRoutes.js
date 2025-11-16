const express = require("express");
const router = express.Router();
const auctionController = require("../controllers/auctionController");
const { protect, isAdmin } = require("../middlewares/auth");
const validate = require("../middlewares/validateSchema");

const {
  createAuctionSchema,
  updateAuctionSchema,
} = require("../validations/auction");

//Public
router.get("/", auctionController.getActiveAuctions);
router.get("/:id", auctionController.getAuctionById);

//Admin
router.post(
  "/",
  protect,
  isAdmin,
  validate(createAuctionSchema),
  auctionController.createAuction
);

router.put(
  "/:id",
  protect,
  isAdmin,
  validate(updateAuctionSchema),
  auctionController.updateAuction
);

router.delete("/:id", protect, isAdmin, auctionController.cancelAuction);

module.exports = router;
