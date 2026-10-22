const mongoose = require('mongoose');
require('dotenv').config();

let isConnected = false;

const connectDB = async () => {
    if (isConnected && mongoose.connection.readyState === 1) {
        return;
    }

    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoURI) {
        throw new Error('MONGODB_URI is required');
    }

    try {
        mongoose.set('strictQuery', false);
        const db = await mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000,
        });

        isConnected = db.connections[0].readyState === 1;
        console.log('✅ MongoDB Connected Successfully');
        console.log(`📊 Database: ${mongoose.connection.name}`);
    } catch (error) {
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
