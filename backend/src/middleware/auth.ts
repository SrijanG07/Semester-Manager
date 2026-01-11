import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

export interface AuthRequest extends Request {
    user?: any;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        let token;

        // Check for token in headers
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ message: 'Not authorized, no token' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { id: string };

        // Get user from token
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            return res.status(401).json({ message: 'User not found' });
        }

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

// Generate JWT token
export const generateToken = (id: string): string => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'your-secret-key', {
        expiresIn: '30d',
    });
};
