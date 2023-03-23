const { get_user } = require('../util/tangletunes');
const { ethers } = require('ethers');
const express = require('express');
const crypto = require('crypto');

const router = express.Router();

router.get('/', async (req, res) => {
    if (req.session.address) {
        const user = await get_user(req.session.address, req.app)
        //TODO: check if it is deployer and redirect to /admin
        //Create new account if it doesn't have
        if (!user.exists) {
            return res.redirect('/validator/register')
        }
        //Request song uploads
        if (!user.is_validator) {
            return res.redirect('/validator/request')
        }
        //Upload requested songs as validator
        return res.redirect('/validator/validate')
    }

    req.session.nonce = crypto.randomUUID()
    res.render('../views/index.ejs', {
        nonce: req.session.nonce
    });
});

router.post('/', (req, res) => {
    const signature = req.body.signature
    const nonce = req.session.nonce

    if (signature && nonce) {
        req.session.address = ethers.verifyMessage(nonce, signature)
    }
    
    return res.redirect('/')
});

module.exports = router;