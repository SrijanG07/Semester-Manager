const express = require('express');
const { getStreak, getAchievements, markAchievementSeen } = require('../controllers/gamificationController');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.get('/streak', getStreak);
router.get('/achievements', getAchievements);
router.put('/achievements/:type/seen', markAchievementSeen);

module.exports = router;
