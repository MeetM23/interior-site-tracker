const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const User = require('./models/User');
        const admin = await User.findOne({ email: 'admin@admin.com' });
        console.log("Admin details:", admin);
        
        if (admin) {
           const bcrypt = require('bcryptjs');
           const match = await bcrypt.compare('password123', admin.password);
           console.log("Does password123 match?", match);
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
