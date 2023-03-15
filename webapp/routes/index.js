const { get_user } = require('../util/tangletunes');
const { ethers } = require('ethers');
const sanitizeHtml = require('sanitize-html');
const express = require('express');
const crypto = require('crypto');

const router = express.Router();

router.get('/', async (req, res) => {
    if (req.session.address) {
        const user = await get_user(req.session.address)
        //TODO: check if it is deployer and redirect to /admin
        //Create new account if it doesn't have
        if (!user.exists) {
            //TODO: page to create user account
            return res.end("You are not a user of TangleTunes, please create an account.")
        }
        //Request song uploads
        if (!user.is_validator) {
            //TODO: page to request song uploads
            return res.end(`Welcome to TangleTunes, ${sanitizeHtml(user["username"])}. Request a song upload`)
        }
        //Upload requested songs as validator
        return res.redirect('/validator')
    }

    req.session.nonce = crypto.randomBytes(16).toString('utf8')
    res.render('../views/index.ejs', {
        nonce: req.session.nonce
    });
});

router.post('/', (req, res) => {
    const signature = req.body.signature
    if (signature) {
        req.session.address = ethers.verifyMessage(req.session.nonce, signature)
    }
    return res.redirect('/')
});

module.exports = router;