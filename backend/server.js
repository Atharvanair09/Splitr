require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const User = require("./models/User");
const groupRoutes = require("./routes/groupRoutes");
const expenseRoutes = require("./routes/expenseRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

//  MongoDB Connection (FIXED)
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

