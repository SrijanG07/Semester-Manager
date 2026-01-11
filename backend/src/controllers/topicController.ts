import { Response } from 'express';
import Topic from '../models/Topic';
import Resource from '../models/Resource';
import { AuthRequest } from '../middleware/auth';

// @desc Create topic
// @route POST /api/subjects/:id/topics
export const createTopic = async (req: AuthRequest, res: Response) => {
    try {
        const { name, unit, status, notes } = req.body;

        const topic = await Topic.create({
            subjectId: req.params.id,
            name,
            unit,
            status: status || 'not-started',
            notes,
        });

        res.status(201).json(topic);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Get all topics for subject
// @route GET /api/subjects/:id/topics
export const getTopics = async (req: AuthRequest, res: Response) => {
    try {
        const topics = await Topic.find({ subjectId: req.params.id }).sort({ createdAt: -1 });

        // Add resource count for each topic
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
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Get single topic
// @route GET /api/topics/:topicId
export const getTopic = async (req: AuthRequest, res: Response) => {
    try {
        const topic = await Topic.findById(req.params.topicId);

        if (!topic) {
            return res.status(404).json({ message: 'Topic not found' });
        }

        res.json(topic);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Update topic
// @route PUT /api/topics/:topicId
export const updateTopic = async (req: AuthRequest, res: Response) => {
    try {
        const topic = await Topic.findByIdAndUpdate(
            req.params.topicId,
            req.body,
            { new: true, runValidators: true }
        );

        if (!topic) {
            return res.status(404).json({ message: 'Topic not found' });
        }

        res.json(topic);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Update topic status
// @route PATCH /api/topics/:topicId/status
export const updateTopicStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { status } = req.body;

        const topic = await Topic.findById(req.params.topicId);

        if (!topic) {
            return res.status(404).json({ message: 'Topic not found' });
        }

        topic.status = status;
        if (status === 'confident') {
            topic.lastRevisedAt = new Date();
        }
        await topic.save();

        res.json(topic);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Delete topic
// @route DELETE /api/topics/:topicId
export const deleteTopic = async (req: AuthRequest, res: Response) => {
    try {
        const topic = await Topic.findByIdAndDelete(req.params.topicId);

        if (!topic) {
            return res.status(404).json({ message: 'Topic not found' });
        }

        res.json({ message: 'Topic deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Get weak topics for subject
// @route GET /api/subjects/:id/weak-topics
export const getWeakTopics = async (req: AuthRequest, res: Response) => {
    try {
        const topics = await Topic.find({ subjectId: req.params.id });

        const weakTopics = await Promise.all(
            topics.map(async (topic) => {
                const totalResources = await Resource.countDocuments({ topicId: topic._id });
                const completedResources = await Resource.countDocuments({ topicId: topic._id, completed: true });
                const completionRate = totalResources > 0 ? (completedResources / totalResources) * 100 : 0;

                // A topic is "weak" if:
                // - Status is "needs-practice" or "learning"
                // - OR completion rate < 50%
                // - OR status is "not-started" and has resources
                const isWeak =
                    topic.status === 'needs-practice' ||
                    topic.status === 'learning' ||
                    (completionRate < 50 && totalResources > 0) ||
                    (topic.status === 'not-started' && totalResources > 0);

                if (isWeak) {
                    return {
                        ...topic.toObject(),
                        totalResources,
                        completedResources,
                        completionRate,
                        reason: completionRate < 50 ? 'Low completion rate' : `Status: ${topic.status}`,
                    };
                }
                return null;
            })
        );

        res.json(weakTopics.filter(t => t !== null));
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
