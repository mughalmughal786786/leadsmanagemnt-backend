const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

const updateAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('meismypassword', salt);

    // Update admin user
    const result = await User.updateOne(
      { role: 'admin' },
      {
        $set: {
          email: 'alitechnologies33@gmail.com',
          password: hashedPassword,
          name: 'Admin'
        }
      }
    );

    if (result.modifiedCount > 0) {
      console.log('✅ Admin credentials updated successfully!');
      console.log('Email: alitechnologies33@gmail.com');
      console.log('Password: meismypassword');
    } else {
      console.log('ℹ️  Admin user not found or already has these credentials');
    }

    // Verify the update
    const admin = await User.findOne({ email: 'alitechnologies33@gmail.com' });
    if (admin) {
      console.log('\n✅ Admin user verified:');
      console.log('- Email:', admin.email);
      console.log('- Role:', admin.role);
      console.log('- Name:', admin.name);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating admin:', error);
    process.exit(1);
  }
};

updateAdmin();
