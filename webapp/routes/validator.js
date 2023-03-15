const authMiddleware = require('../middleware/authMiddleware');
const express = require('express');

const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
    if (!req.user.is_validator) {
        return res.redirect('/')
    }

    res.render('../views/validator.ejs', {
        username: req.user.username,
        contract: process.env.CONTRACT
    });
});

router.get('/register', authMiddleware, (req, res) => {
    if (req.user.exists) {
        return res.redirect('/')
    }

    return res.render('../views/register.ejs', {
        contract: process.env.CONTRACT
    });
})

module.exports = router;