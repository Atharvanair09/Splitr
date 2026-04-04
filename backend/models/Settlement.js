const mongoose = require("mongoose");

const settlementSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },

    fromUser: {
      type: String, //ObjectId User model
      required: true,
    },

    toUser: {
      type: String, //ObjectId
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },

    paymentId: {
      type: String, // Razorpay payment ID
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Settlement", settlementSchema);