const express = require('express');
const { calculateGpa, simulateGpa } = require('../controllers/gpaController');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.get('/calculate', calculateGpa);
router.post('/simulate', simulateGpa);

module.exports = router;
