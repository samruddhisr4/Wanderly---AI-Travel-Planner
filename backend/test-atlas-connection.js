require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;

console.log('Testing MongoDB connection...');
console.log('URI:', uri.replace(/:([^:@]+)@/, ':****@')); // Mask password

mongoose.connect(uri)
    .then(() => {
        console.log('✅ Connection Successful!');
        console.log('Successfully connected to MongoDB Atlas.');
        mongoose.connection.close();
    })
    .catch(err => {
        console.error('❌ Connection Failed!');
        console.error('Error:', err.message);
        process.exit(1);
    });
