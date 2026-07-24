const Topic = require('../models/Topic');
const Resource = require('../models/Resource');

// @desc Create topic
// @route POST /api/subjects/:id/topics
const createTopic = async (req, res) => {
    try {
        const { name, unit, status, notes } = req.body;
        const topic = await Topic.create({
            subjectId: req.params.id,
            name, unit,
            status: status || 'not-started',
            notes,
        });
        res.status(201).json(topic);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Get all topics for subject
// @route GET /api/subjects/:id/topics
const getTopics = async (req, res) => {
    try {
        const topics = await Topic.find({ subjectId: req.params.id }).sort({ createdAt: -1 });

        const topicsWithStats = await Promise.all(
            topics.map(async (topic) => {
                const totalResources = await Resource.countDocuments({ topicId: topic._id });
                const completedResources = await Resource.countDocuments({ topicId: topic._id, completed: true });
                return {
                    ...topic.toObject(),
                    totalResources,
                    completedResources,
                    completionRate: totalResources > 0 ? (completedResources / totalResources) * 100 : 0,
                };
            })
        );

        res.json(topicsWithStats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Get single topic
// @route GET /api/topics/:topicId
const getTopic = async (req, res) => {
    try {
        const topic = await Topic.findById(req.params.topicId);
        if (!topic) return res.status(404).json({ message: 'Topic not found' });
        res.json(topic);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Update topic
// @route PUT /api/topics/:topicId
const updateTopic = async (req, res) => {
    try {
        const topic = await Topic.findByIdAndUpdate(req.params.topicId, req.body, { new: true, runValidators: true });
        if (!topic) return res.status(404).json({ message: 'Topic not found' });
        res.json(topic);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Update topic status
// @route PATCH /api/topics/:topicId/status
const updateTopicStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const topic = await Topic.findById(req.params.topicId);
        if (!topic) return res.status(404).json({ message: 'Topic not found' });

        topic.status = status;
        if (status === 'confident') topic.lastRevisedAt = new Date();
        await topic.save();

        res.json(topic);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Delete topic
// @route DELETE /api/topics/:topicId
const deleteTopic = async (req, res) => {
    try {
        const topic = await Topic.findByIdAndDelete(req.params.topicId);
        if (!topic) return res.status(404).json({ message: 'Topic not found' });
        res.json({ message: 'Topic deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Get weak topics for subject
// @route GET /api/subjects/:id/weak-topics
const getWeakTopics = async (req, res) => {
    try {
        const topics = await Topic.find({ subjectId: req.params.id });

        const weakTopics = await Promise.all(
            topics.map(async (topic) => {
                const totalResources = await Resource.countDocuments({ topicId: topic._id });
                const completedResources = await Resource.countDocuments({ topicId: topic._id, completed: true });
                const completionRate = totalResources > 0 ? (completedResources / totalResources) * 100 : 0;

                const isWeak =
                    topic.status === 'needs-practice' ||
                    topic.status === 'learning' ||
                    (completionRate < 50 && totalResources > 0) ||
                    (topic.status === 'not-started' && totalResources > 0);

                if (isWeak) {
                    return {
                        ...topic.toObject(),
                        totalResources, completedResources, completionRate,
                        reason: completionRate < 50 ? 'Low completion rate' : `Status: ${topic.status}`,
                    };
                }
                return null;
            })
        );

        res.json(weakTopics.filter(t => t !== null));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createTopic, getTopics, getTopic, updateTopic, updateTopicStatus, deleteTopic, getWeakTopics };
