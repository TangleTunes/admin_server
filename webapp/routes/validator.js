const express = require('express');

const router = express.Router();

router.get('/', async (req, res) => {
    res.sendFile(path.join(__dirname, '../views/validator.html'));
});

module.exports = router;