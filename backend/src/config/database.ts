import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async (): Promise<void> => {
    try {
        if (mongoose.connection.readyState >= 1) {
            return;
        }
        // Use MongoDB Atlas cloud database (free tier) as fallback
        const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://semester-admin:Semester2024Pass@cluster0.jtwyx.mongodb.net/semester-manager?retryWrites=true&w=majority';

        await mongoose.connect(mongoURI);

        console.log('✅ MongoDB Connected Successfully');
        console.log(`📊 Database: ${mongoose.connection.name}`);
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error);
        process.exit(1);
    }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
    console.log('⚠️ MongoDB Disconnected');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB Error:', err);
});

export default connectDB;
