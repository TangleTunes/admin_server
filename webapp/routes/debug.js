const { spawnSync } = require('child_process');
const express      = require('express');

const router = express.Router();

router.get('/info', async (req, res) => {
    return res.json({
        "json-rpc": `http://${req.headers.host}:9090/chains/${req.app.get('CHAIN_ID')}/evm`,
        "chainID": 1074,
        "smart-contract": req.app.get('contract')
    });
})

router.get('/faucet', async (req, res) => {
    res.render('../views/faucet.ejs', {
        addr: req.query.address,
        requested: false
    });
})

router.get('/faucet/:addr', async (req, res) => {
    process = spawnSync("/bin/bash", ["/app/scripts/request-funds.sh", req.params.addr]);
    res.render('../views/faucet.ejs', {
        addr: req.params.addr,
        requested: true,
        error: process.stderr.toString()
    });
})

module.exports = router;