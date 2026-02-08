require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User'); // Adjust path as needed
const bcrypt = require('bcryptjs');

const uri = process.env.MONGODB_URI;

console.log('Connecting to DB...');
mongoose.connect(uri)
    .then(async () => {
        console.log('Connected.');

        // Clean up test user if exists
        await User.deleteOne({ email: 'test@example.com' });

        console.log('Creating test user...');
        try {
            const newUser = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123'
            });

            console.log('Saving user...');
            await newUser.save();
            console.log('✅ User saved successfully!');
            console.log('User ID:', newUser._id);

            // Verify password hashing
            console.log('Hashed password:', newUser.password);

            process.exit(0);
        } catch (err) {
            console.error('❌ Save failed:', err);
            process.exit(1);
        }
    })
    .catch(err => {
        console.error('Connection failed:', err);
        process.exit(1);
    });
