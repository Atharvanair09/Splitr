const express = require("express");
const router = express.Router();
const Expense = require("../models/Expense");

// Add a new expense
router.post("/add", async (req, res) => {
  try {
    const { groupId, amount, paidBy, splitBetween, splitDetails, notes, gmailMessageId } = req.body;

    const expense = new Expense({
      groupId,
      amount,
      paidBy,
      splitBetween,
      splitDetails,
      notes,
      gmailMessageId,
    });

    await expense.save();

    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ error: "Failed to add expense" });
  }
});

// Get all expenses for a group
router.get("/group/:groupId", async (req, res) => {
  try {
    const expenses = await Expense.find({ groupId: req.params.groupId })
      .sort({ createdAt: -1 });

    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch expenses" });
  }
});

// Get all expenses (for dashboard overview)
router.get("/all", async (req, res) => {
  try {
    const expenses = await Expense.find()
      .populate("groupId", "name")
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch expenses" });
  }
});

// Get all expenses for a user (across all their groups)
router.get("/user/:userName", async (req, res) => {
  try {
    const userName = req.params.userName;
    const Group = require("../models/Group");
    
    // 1. Find groups where user is a member
    const userGroups = await Group.find({
      members: { $regex: new RegExp(userName, "i") }
    }).select("_id");
    
    const groupIds = userGroups.map(g => g._id);

    // 2. Find expenses in those groups
    const expenses = await Expense.find({
      groupId: { $in: groupIds }
    })
      .populate("groupId", "name")
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(expenses);
  } catch (err) {
    console.error("User expenses error:", err);
    res.status(500).json({ error: "Failed to fetch user expenses" });
  }
});

module.exports = router;