require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/splitr')
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.post('/api/auth/google', async (req, res) => {
  console.log("---- INCOMING GOOGLE AUTH REQUEST ----");
  console.log("Req Body:", req.body);
  try {
    const { googleId, email, name, picture } = req.body;

    if (!googleId || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user exists
    let user = await User.findOne({ googleId });

    if (user) {
      // User exists, just return them
      console.log('Existing user logged in:', user.email);
      return res.status(200).json({ message: 'Login successful', user });
    }

    // Create new user
    // Create new user
    user = new User({
      googleId,
      email,
      name: name || "Google User",
      picture
    });

    await user.save();
    console.log('New user created:', user.email);
    
    return res.status(201).json({ message: 'User created successfully', user });

  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: error.message || 'Server error during authentication' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
