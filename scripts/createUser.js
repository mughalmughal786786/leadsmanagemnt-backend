const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Create users
const createUsers = async () => {
  try {
    // Check if users already exist
    const adminExists = await User.findOne({ email: 'admin@example.com' });
    const csrExists = await User.findOne({ email: 'csr@example.com' });

    if (!adminExists) {
      await User.create({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin'
      });
      console.log('✅ Admin user created: admin@example.com / admin123');
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    if (!csrExists) {
      await User.create({
        name: 'CSR User',
        email: 'csr@example.com',
        password: 'csr123',
        role: 'csr'
      });
      console.log('✅ CSR user created: csr@example.com / csr123');
    } else {
      console.log('ℹ️  CSR user already exists');
    }

    console.log('\n✅ User creation completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating users:', error);
    process.exit(1);
  }
};

createUsers();
