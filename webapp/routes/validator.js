const authMiddleware = require('../middleware/authMiddleware');
const express = require('express');

const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
    res.render('../views/validator.ejs', {
        username: req.user.username,
        contract: process.env.CONTRACT
    });
});

module.exports = router;