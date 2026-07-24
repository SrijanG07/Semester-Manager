const express = require('express');
const { exportData, importData } = require('../controllers/exportController');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.get('/export', exportData);
router.post('/import', importData);

module.exports = router;
