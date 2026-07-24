const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        if (mongoose.connection.readyState >= 1) return;

        const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://semester-admin:Semester2024Pass@cluster0.jtwyx.mongodb.net/semester-manager?retryWrites=true&w=majority';
        await mongoose.connect(mongoURI);

        console.log('✅ MongoDB Connected Successfully');
        console.log(`📊 Database: ${mongoose.connection.name}`);
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error);
        process.exit(1);
    }
};

mongoose.connection.on('disconnected', () => {
    console.log('⚠️ MongoDB Disconnected');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB Error:', err);
});

module.exports = connectDB;
