const express = require('express');
const router = express.Router();

// Temporary test route
router.get('/', (req, res) => {
  res.json({ message: 'Entries route working' });
});

module.exports = router;
