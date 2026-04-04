const express = require("express");
const router = express.Router();
const Expense = require("../models/Expense");

router.post("/add", async (req, res) => {
  try {
    const { groupId, amount, paidBy, splitBetween, notes } = req.body;

    const expense = new Expense({
      groupId,
      amount,
      paidBy,
      splitBetween,
      notes,
    });

    await expense.save();

    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ error: "Failed to add expense" });
  }
});

module.exports = router;