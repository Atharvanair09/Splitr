const express = require("express");
const router = express.Router();
const Group = require("../models/Group");
const Expense = require("../models/Expense");

router.post("/create", async (req, res) => {
  try {
    const { name, members } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Group name required" });
    }

    const group = new Group({
      name,
      members
    });

    await group.save();
    res.json(group);
    console.log("Group created:", group);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Join Group via Code
router.post("/join", async (req, res) => {
  try {
    const { joinCode, userName } = req.body;
    if (!joinCode || !userName) {
      return res.status(400).json({ message: "Code and name required" });
    }

    const group = await Group.findOne({ joinCode: joinCode.toUpperCase() });
    if (!group) {
      return res.status(404).json({ message: "Invalid join code" });
    }

    // Check if user is already a member
    const isMember = group.members.some(m => m.toLowerCase() === userName.toLowerCase());
    if (isMember) {
      return res.status(200).json({ message: "Already a member", group });
    }

    group.members.push(userName);
    await group.save();

    res.json({ success: true, group });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all groups
router.get("/all", async (req, res) => {
  try {
    const groups = await Group.find().sort({ createdAt: -1 });
    res.json(groups);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    res.json(group);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete Group and its Expenses
router.delete("/:id", async (req, res) => {
  try {
    const groupId = req.params.id;
    console.log(`[DELETE] Request for group: ${groupId}`);
    
    // 1. Delete all expenses for this group
    const Expense = require("../models/Expense");
    await Expense.deleteMany({ groupId });

    // 2. Delete the group
    await Group.findByIdAndDelete(groupId);

    console.log(`[DELETE] Group ${groupId} and its expenses removed.`);
    res.json({ message: "Group and expenses deleted successfully" });
  } catch (err) {
    console.error("Delete Group Error:", err);
    res.status(500).json({ message: "Server error during deletion" });
  }
});

// Get all groups where user is a member
router.get("/user/:userName", async (req, res) => {
  try {
    const groups = await Group.find({
      members: { $regex: new RegExp(req.params.userName, "i") }
    }).sort({ createdAt: -1 });

    res.json(groups);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete a group and its expenses
router.delete("/delete/:id", async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Delete all expenses for this group
    await Expense.deleteMany({ groupId: req.params.id });

    // Delete the group
    await Group.findByIdAndDelete(req.params.id);

    res.json({ message: "Group deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;