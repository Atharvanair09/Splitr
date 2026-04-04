const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  paidBy: {
    type: String,
    required: true,
  },
  splitBetween: [
    {
      type: String,
    },
  ],
  splitDetails: [
    {
      name: { type: String },
      amount: { type: Number }
    }
  ],
  notes: {
    type: String,
  },
}, { timestamps: true });

module.exports = mongoose.model("Expense", expenseSchema);