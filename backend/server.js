require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const User = require("./models/User");
const Expense = require("./models/Expense");
const groupRoutes = require("./routes/groupRoutes");
const expenseRoutes = require("./routes/expense");
const paymentRoutes = require("./routes/payment");
const { router: authRouter } = require("./routes/auth");
const { fetchTransactionEmails } = require("./services/gmailService");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

//  MongoDB Connection 
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
};

// Connect DB then start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

// Test Route
app.get("/", (req, res) => {
  res.send("API is running...");
});

//  Google Auth Route
app.post("/api/auth/google", async (req, res) => {
  console.log("---- INCOMING GOOGLE AUTH REQUEST ----");
  console.log("Req Body:", req.body);

  try {
    const { googleId, email, name, picture } = req.body;

    if (!googleId || !email) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if user exists
    let user = await User.findOne({ googleId });

    if (user) {
      console.log("Existing user logged in:", user.email);
      return res.status(200).json({
        message: "Login successful",
        user,
      });
    }

    // Create new user
    user = new User({
      googleId,
      email,
      name: name || "Google User",
      picture,
    });

    await user.save();

    console.log("New user created:", user.email);

    return res.status(201).json({
      message: "User created successfully",
      user,
    });
  } catch (error) {
    console.error("Auth error:", error);
    res.status(500).json({
      error: error.message || "Server error during authentication",
    });
  }
});

//Group routes

app.use("/group", groupRoutes);

//Expense routes
app.use("/expense", expenseRoutes);

//payment routes
app.use("/api/payment", paymentRoutes);

//subscription routes
app.use("/api/subscription", require("./routes/subscription"));

// Gmail routes
app.use("/api/auth/gmail", authRouter);

app.get("/api/transactions", async (req, res) => {
  try {
    const transactions = await fetchTransactionEmails();
    
    // Find all Gmail IDs already processed
    const processedIds = await Expense.find({ gmailMessageId: { $ne: null } }).distinct("gmailMessageId");
    
    // Filter out transactions that exist in database
    const filtered = transactions.filter(tx => !processedIds.includes(tx.id));
    
    res.json(filtered);
  } catch (err) {
    console.error("Fetch transactions error:", err);
    res.status(500).json({ error: "Failed to fetch transactions from Gmail" });
  }
});

// --- USER SEARCH & FRIENDS SYSTEM ---

// 1. Search Users
app.get("/api/users/search", async (req, res) => {
  try {
    const { query, currentUserId } = req.query;
    console.log(`Search request: query="${query}", currentUserId="${currentUserId}"`);
    
    if (!query || query.length < 2) {
      return res.json([]);
    }

    const searchFilter = {
      $or: [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } }
      ]
    };

    if (currentUserId && mongoose.Types.ObjectId.isValid(currentUserId)) {
      searchFilter._id = { $ne: currentUserId };
    }

    const users = await User.find(searchFilter).limit(10);
    console.log(`Found ${users.length} users matching "${query}"`);
    res.json(users);
  } catch (err) {
    console.error("Search API Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Request to Follow (Send Request)
app.post("/api/users/follow", async (req, res) => {
  try {
    const { userId, targetId } = req.body;
    if (userId === targetId) return res.status(400).json({ error: "Cannot follow yourself" });

    // Add targetId to userId's outgoing
    await User.findByIdAndUpdate(userId, { $addToSet: { outgoingRequests: targetId } });
    // Add userId to targetId's incoming
    await User.findByIdAndUpdate(targetId, { $addToSet: { incomingRequests: userId } });

    res.json({ success: true, message: "Follow request sent" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Accept Follow Request
app.post("/api/users/accept-request", async (req, res) => {
  try {
    const { userId, targetId } = req.body; // userId is ME, targetId is HIM (requester)

    // Move him from my incomingRequests to friends
    await User.findByIdAndUpdate(userId, {
      $pull: { incomingRequests: targetId },
      $addToSet: { friends: targetId }
    });

    // Move me from his outgoingRequests to friends
    await User.findByIdAndUpdate(targetId, {
      $pull: { outgoingRequests: userId },
      $addToSet: { friends: userId }
    });

    res.json({ success: true, message: "Request accepted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Decline/Cancel Request
app.post("/api/users/decline-request", async (req, res) => {
  try {
    const { userId, targetId } = req.body;
    await User.findByIdAndUpdate(userId, { $pull: { incomingRequests: targetId } });
    await User.findByIdAndUpdate(targetId, { $pull: { outgoingRequests: userId } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Get My Pending Incoming Requests
app.get("/api/users/requests/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate("incomingRequests", "name email picture");
    res.json(user.incomingRequests || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Unfollow/Remove Friend
app.post("/api/users/unfollow", async (req, res) => {
  try {
    const { userId, targetId } = req.body;
    await User.findByIdAndUpdate(userId, { $pull: { friends: targetId } });
    await User.findByIdAndUpdate(targetId, { $pull: { friends: userId } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Get Friends List (Only accepted)
app.get("/api/users/friends/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate("friends", "name email picture");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user.friends);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7b. Update User Profile
app.put("/api/users/:userId/profile", async (req, res) => {
  try {
    const { userId } = req.params;
    const { phoneNumber } = req.body;
    
    const user = await User.findByIdAndUpdate(
      userId, 
      { phoneNumber }, 
      { new: true }
    );
    
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Deactivate / Delete Account
app.delete("/api/users/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res.status(404).json({ error: "User not found" });
    }
    console.log(`Account deactivated: ${deletedUser.email}`);
    res.json({ success: true, message: "Account successfully deactivated" });
  } catch (err) {
    console.error("Deactivate error:", err);
    res.status(500).json({ error: "Failed to deactivate account" });
  }
});

