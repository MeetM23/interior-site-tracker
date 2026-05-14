const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://interior-site-tracker.vercel.app',
    process.env.CLIENT_URL
  ].filter(Boolean),
  credentials: true,
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000,
    });
    console.log('✅ MongoDB securely connected');

    // Auto-seed default SUPER_ADMIN
    const User = require('./models/User');
    const AdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@admin.com';
    const AdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'password123';
    
    const existingAdmin = await User.findOne({ email: AdminEmail });
    if (!existingAdmin) {
      await User.create({
        name: 'System Admin',
        email: AdminEmail,
        password: AdminPassword,
        role: 'SUPER_ADMIN'
      });
      console.log(`✅ Created default SUPER_ADMIN: ${AdminEmail} / ${AdminPassword}`);
    } else if (existingAdmin.role !== 'SUPER_ADMIN') {
      // If the admin user already exists from the old architecture (e.g. as 'owner' or another role), upgrade it
      existingAdmin.role = 'SUPER_ADMIN';
      await existingAdmin.save();
      console.log(`✅ Upgraded existing user to SUPER_ADMIN: ${AdminEmail}`);
    }

  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1); 
  }
};

connectDB();

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/companies', require('./routes/companies'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/calendar', require('./routes/calendar'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/admin', require('./routes/admin'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});