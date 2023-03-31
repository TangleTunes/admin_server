const authMiddleware = require('../middleware/authMiddleware');
const { spawnSync } = require('child_process');
const fs = require('fs');
const express = require('express');
const multer  = require('multer');
const sanitizeHtml = require('sanitize-html');
const { get_song_id, get_user, get_author_nonce } = require('../util/tangletunes')

const router = express.Router();

router.get('/validate', authMiddleware, (req, res) => {
    if (!req.user.is_validator) {
        return res.redirect('/validator/request')
    }

    res.render('../views/validator.ejs', {
        username: sanitizeHtml(req.user.username),
        contract: req.app.get('contract'),
        songs: req.app.get('songs')
    });
});

router.post('/validate', authMiddleware, (req, res) => {
    if (!req.user.is_validator) {
        return res.end('Nope! only for validators');
    }

    const { approved, id } = req.body
    if (!approved || !id) return res.end('missing arguments');
    
    //TODO: check id is valid file
    const filepath = `/app/static/uploads/${id}`
    if (approved == 'true') {
        spawnSync("/usr/bin/ttdistributor", ['songs', 'add', filepath], {
            cwd: "/app/wallet", 
            stdio: 'inherit'
        });
    }

    delete req.app.get('songs')[id]
    fs.unlinkSync(filepath)

    //TODO: add confirmation
    res.render('../views/validator.ejs', {
        username: sanitizeHtml(req.user.username),
        contract: req.app.get('contract'),
        songs: req.app.get('songs')
    });
});

router.get('/request', authMiddleware, async (req, res) => {
    if (!req.user.exists) {
        return res.redirect('/validator/register')
    }

    res.render('../views/request.ejs', {
        contract: req.app.get('contract'),
        author_nonce: await get_author_nonce(req.session.address, req.app),
        rightholder: {
            address: req.session.address,
            name: req.user.username
        }
    });
})

router.post('/request', authMiddleware, multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, '/app/static/uploads')
        },
        filename: function (req, file, cb) {
            if (!req.body.name || !req.body.author_addr) return cb('missing arguments')
            try {
                cb(null, get_song_id(req.body.name, req.body.author_addr)+'.mp3')
            } catch (error) {
                cb(`invalid arguments: ${error}`)
            }
        }
    }) 
}).single('file'), async (req, res) => {
    if (!req.user.exists) {
        return res.end('Nope! only for users with tangletunes account');
    }

    if (!req.file) return res.end('missing mp3 file')
    
    const { author_addr, name, price, contact, nonce, sig } = req.body
    if (!author_addr || !name || !price || !contact || !nonce || !sig) return res.end('missing arguments')

    try {
        const author = await get_user(author_addr, req.app)
        req.app.get("songs")[req.file.filename] = {
            "author": author_addr,
            "author_name": author.username,
            "name": name,
            "price": price,
            "contact": contact,
            "nonce": nonce,
            "signature": sig
        }
    } catch {
        return res.end('invalid arguments')
    }

    //TODO: add feedback that the song has been uploaded
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