const express = require("express");
const router = express.Router();
const Group = require("../models/Group");

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
    console.log(group);
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

module.exports = router;