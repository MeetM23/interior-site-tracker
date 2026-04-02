const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// 1. Load environment variables for local development
require('dotenv').config();

const app = express();

// 2. Configure CORS to allow local and production frontends
const allowedOrigins = [
  'http://localhost:3000',
  process.env.CLIENT_URL,
  'https://interior-site-tracker.vercel.app' // Explicitly adding for safety
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 3. Connect to MongoDB using process.env.MONGODB_URI
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB securely connected');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1); // Exit process with failure
  }
};

connectDB();

// 4. Routes
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/users',    require('./routes/users'));
app.use('/api/tasks',    require('./routes/tasks'));

// 5. Start Server using process.env.PORT
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});