const mongoose = require('mongoose');
const Subject = require('../models/Subject');

// All nested academic records belong to a subject. Resolve that subject once.
function ownsRecord(modelName, parameter) {
    return async (req, res, next) => {
        try {
            const id = req.params[parameter];
            if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid record ID' });
            const record = modelName === 'Subject'
                ? await Subject.findById(id)
                : await require(`../models/${modelName}`).findById(id);
            if (!record) return res.status(404).json({ message: 'Record not found' });
            const subject = modelName === 'Subject' ? record : await Subject.findById(record.subjectId);
            if (!subject || String(subject.userId) !== String(req.user._id)) {
                return res.status(404).json({ message: 'Record not found' });
            }
            // Ownership and relationship fields cannot be reassigned through an update.
            if (req.method === 'PUT' || req.method === 'PATCH') {
                for (const key of ['_id', 'userId', 'subjectId', 'createdAt']) delete req.body[key];
                if (Object.keys(req.body).some(key => key.startsWith('$'))) {
                    return res.status(400).json({ message: 'Update operators are not allowed' });
                }
            }
            next();
        } catch (error) { next(error); }
    };
}
module.exports = { ownsRecord };
