const mongoose = require('mongoose');
const User = require('./models/User');

async function test() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb://127.0.0.1:27017/splitr');
    console.log('Connected.');
    
    console.log('Finding user...');
    const user = await User.findOne({ googleId: '123' });
    console.log('Result:', user);
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    mongoose.disconnect();
  }
}
test();
