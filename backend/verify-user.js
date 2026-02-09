const mongoose = require('mongoose');
const User = require('./src/models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const verifyUser = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const email = 'samruddhisr4@gmail.com';
        const user = await User.findOne({ email });

        if (!user) {
            console.log(`User not found: ${email}`);
        } else {
            console.log(`User found: ${user.email}`);
            console.log(`User ID: ${user._id}`);

            const isMatch = await bcrypt.compare('samruddhisr4@gmail.com', user.password);
            console.log(`Password match for 'samruddhisr4@gmail.com': ${isMatch}`);

            // Also test with trimmed password just in case
            const isMatchTrimmed = await bcrypt.compare('samruddhisr4@gmail.com'.trim(), user.password);
            console.log(`Password match (trimmed): ${isMatchTrimmed}`);
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
};

verifyUser();
