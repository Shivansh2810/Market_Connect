const Coupon = require("../models/coupon");
const { applyCouponSchema, createCouponSchema, updateCouponSchema } = require("../validations/coupon");

const applyCoupon = async (req, res) => {
  try {
    const { error, value } = applyCouponSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid data",
        error: error.details[0].message
      });
    }

    const { couponCode, cartValue } = value;

    const coupon = await Coupon.findOne({ code: couponCode });
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found"
      });
    }

    if (!coupon.isValid(cartValue)) {
      return res.status(400).json({
        success: false,
        message: "This coupon cannot be applied to your order"
      });
    }

    const discountAmount = coupon.calculateDiscount(cartValue);
    const finalAmount = cartValue - discountAmount;

    res.json({
      success: true,
      message: "Coupon applied successfully",
      data: {
        coupon: {
          code: coupon.code,
          description: coupon.description,
          discountAmount: discountAmount,
          minOrderValue: coupon.minOrderValue
        },
        cartSummary: {
          originalAmount: cartValue,
          discountAmount: discountAmount,
          finalAmount: finalAmount
        }
      }
    });

  } catch (error) {
    console.error("Apply coupon error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to apply coupon",
      error: error.message
    });
  }
};

const createCoupon = async (req, res) => {
  try {
    const { error, value } = createCouponSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid data",
        error: error.details[0].message
      });
    }

    const coupon = new Coupon(value);
    await coupon.save();

    res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      data: coupon
    });

  } catch (error) {
    console.error("Create coupon error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create coupon",
      error: error.message
    });
  }
};

const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      message: "Coupons retrieved successfully",
      data: coupons,
      count: coupons.length
    });

  } catch (error) {
    console.error("Get coupons error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get coupons",
      error: error.message
    });
  }
};

const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const { error, value } = updateCouponSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid data",
        error: error.details[0].message
      });
    }

    const coupon = await Coupon.findByIdAndUpdate(
      id,
      value,
      { new: true, runValidators: true }
    );

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found"
      });
    }

    res.json({
      success: true,
      message: "Coupon updated successfully",
      data: coupon
    });

  } catch (error) {
    console.error("Update coupon error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update coupon",
      error: error.message
    });
  }
};

const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findByIdAndDelete(id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found"
      });
    }

    res.json({
      success: true,
      message: "Coupon deleted successfully"
    });

  } catch (error) {
    console.error("Delete coupon error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete coupon",
      error: error.message
    });
  }
};

module.exports = {
  applyCoupon,
  createCoupon,
  getCoupons,
  updateCoupon,
  deleteCoupon
};