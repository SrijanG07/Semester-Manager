const mongoose = require('mongoose');
require('dotenv').config();

let isConnected = false;

const connectDB = async () => {
    if (isConnected || mongoose.connection.readyState >= 1) {
        return;
    }

    try {
        const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb+srv://semester-admin:Semester2024Pass@cluster0.jtwyx.mongodb.net/semester-manager?retryWrites=true&w=majority';
        
        const db = await mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 5000,
        });

        isConnected = db.connections[0].readyState === 1;
        console.log('✅ MongoDB Connected Successfully');
        console.log(`📊 Database: ${mongoose.connection.name}`);
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error.message);
        // Do not call process.exit(1) on Vercel as it crashes the entire serverless lambda
        if (!process.env.VERCEL && process.env.NODE_ENV !== 'production') {
            process.exit(1);
        }
        throw error;
    }
};

mongoose.connection.on('disconnected', () => {
    isConnected = false;
    console.log('⚠️ MongoDB Disconnected');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB Error:', err.message);
});

module.exports = connectDB;
