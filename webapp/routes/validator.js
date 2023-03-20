const authMiddleware = require('../middleware/authMiddleware');
const fs = require('fs');
const express = require('express');
const multer  = require('multer');
const sanitizeHtml = require('sanitize-html');
const { get_song_id } = require('../util/tangletunes')

const router = express.Router();
const storage = multer.diskStorage({
    destination: './static/uploads',
    filename: (req, file, cb) => cb(null, get_song_id(req.body.name, req.body.author)+'.mp3')
});
const upload = multer({ storage })

router.get('/validate', authMiddleware, (req, res) => {
    if (!req.user.is_validator) {
        return res.redirect('/validator/request')
    }

    res.render('../views/validator.ejs', {
        username: sanitizeHtml(req.user.username),
        contract: req.app.get('contract')
    });
});

router.get('/request', authMiddleware, (req, res) => {
    if (!req.user.exists) {
        return res.redirect('/validator/register')
    }

    res.render('../views/request.ejs', {
        username: sanitizeHtml(req.user.username)
    });
})

router.post('/request', authMiddleware, upload.single('file'), (req, res) => {
    req.app.get("songs")[req.file.filename] = {
        "author": req.body.author,
        "name": req.body.name,
        "price": req.body.price
    }

    //TODO: add notification that the song has been uploaded
    res.redirect('/validator/request');
})

router.get('/register', authMiddleware, (req, res) => {
    if (req.user.exists) {
        return res.redirect('/')
    }

    return res.render('../views/register.ejs', {
        contract: req.app.get('contract')
    });
})

module.exports = router;