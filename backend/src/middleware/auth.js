const jwt = require('jsonwebtoken');
const User = require('../models/User');
if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required');

const protect = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ message: 'Not authorized, no token' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            return res.status(401).json({ message: 'User not found' });
        }

        if (req.body && typeof req.body === 'object') {
            for (const key of ['_id', 'userId', 'createdAt', 'updatedAt']) delete req.body[key];
            if (Object.keys(req.body).some(key => key.startsWith('$'))) {
                return res.status(400).json({ message: 'Update operators are not allowed' });
            }
            const Subject = require('../models/Subject');
            for (const [field, model] of Object.entries({ subjectId: 'Subject', topicId: 'Topic', personalNotesId: 'Resource' })) {
                if (!req.body[field]) continue;
                const record = await require(`../models/${model}`).findById(req.body[field]);
                const subject = model === 'Subject' ? record : record && await Subject.findById(record.subjectId);
                if (!subject || String(subject.userId) !== String(req.user._id)) {
                    return res.status(404).json({ message: 'Related record not found' });
                }
                const expectedSubject = req.body.subjectId || req.params.id;
                if (model !== 'Subject' && expectedSubject && String(record.subjectId) !== String(expectedSubject)) {
                    return res.status(400).json({ message: 'Related record belongs to a different subject' });
                }
            }
        }
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

module.exports = { protect, generateToken };
