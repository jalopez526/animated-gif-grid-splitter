const express = require('express');
const { splitGif } = require('../controllers/gif');

const router = express.Router();

// Route to handle GIF splitting
router.post('/', splitGif);

module.exports = router;