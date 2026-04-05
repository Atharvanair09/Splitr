const express = require("express");
const router = express.Router();
const Razorpay = require("razorpay");
const User = require("../models/User");

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_dummy",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "dummysecret"
});

// A) POST /api/subscription/create-order
router.post("/create-order", async (req, res) => {
  try {
    const options = {
      amount: 99900, // ₹999 in paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);
    res.status(200).json(order);
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({ message: "Failed to create order" });
  }
});

// B) POST /api/subscription/verify
router.post("/verify", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "User ID required" });

    // Mark user as premium
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { isPremium: true, subscriptionDate: new Date(), isTestAccount: false, testActivationDate: null },
      { new: true }
    );

    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Error verifying subscription:", error);
    res.status(500).json({ message: "Failed to verify subscription" });
  }
});

// C) POST /api/subscription/test-activate
router.post("/test-activate", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "User ID required" });

    // Directly mark user as premium without payment (TEST MODE)
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { isPremium: true, testActivationDate: new Date(), isTestAccount: true },
      { new: true }
    );

    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Error in test activation:", error);
    res.status(500).json({ message: "Failed to activate test subscription" });
  }
});

module.exports = router;
