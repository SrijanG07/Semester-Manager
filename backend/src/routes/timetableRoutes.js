const express = require('express');
const { getTimetable, createTimetableEntry, updateTimetableEntry, deleteTimetableEntry } = require('../controllers/timetableController');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.get('/', getTimetable);
router.post('/', createTimetableEntry);
router.put('/:id', updateTimetableEntry);
router.delete('/:id', deleteTimetableEntry);

module.exports = router;
