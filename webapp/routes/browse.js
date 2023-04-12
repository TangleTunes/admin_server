const express = require('express');

const router = express.Router();

router.get('/songs', (req, res) => {
    res.render('../views/songs.ejs', {
        contract: req.app.get('contract')
    });
})

module.exports = router;