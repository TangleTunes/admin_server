const express = require('express');

const router = express.Router();

/*
let chainID = JSON.parse(fs.readFileSync('/app/wallet/wasp-cli.json')).chains.tangletunes
let provider = new ethers.JsonRpcProvider(`http://wasp:9090/chains/${chainID}/evm`, 1074)
let signer = new ethers.Wallet(req.body.key, provider)
let abi = JSON.parse(fs.readFileSync('/tangletunes/abi.json'))
let contract = new ethers.Contract(req.body.contract, abi, signer)
let user = await contract.users(signer.address)
*/

router.get('/contract/set/:address', (req, res) => {
    req.app.set('contract', req.params.address)
    res.json({"contract": req.app.get('contract')})
});

module.exports = router;