const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function checkUsers() {
  await mongoose.connect(process.env.MONGO_URI);
  const users = await User.find({});
  console.log('Total users:', users.length);
  users.forEach(u => console.log(`- ${u.name} (${u.email}) [_id: ${u._id}]`));
  process.exit();
}

checkUsers();
