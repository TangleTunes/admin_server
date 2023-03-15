const { spawnSync } = require('child_process');
const { ethers }   = require('ethers');
const express      = require('express');

const router = express.Router();

router.get('/info', async (req, res) => {
    return res.json({
        "json-rpc": `http://${req.headers.host}:9090/chains/${process.env.CHAIN_ID}/evm`,
        "chainID": 1074,
        "smart-contract": process.env.CONTRACT
    });
})

router.get('/faucet/:addr', async (req, res) => {
    process = spawnSync("/bin/bash", ["/app/scripts/request-funds.sh", req.params.addr]);
    res.json({"error": process.stderr.toString()})
})

router.get('/history', async (req, res) => {
    const provider = new ethers.JsonRpcProvider(`http://wasp:9090/chains/${process.env.CHAIN_ID}/evm`, 1074)
    const transactions = await provider.getBlock('latest').then(block => block.transactions);
    const txData = await Promise.all(transactions.map(async txHash => {
        const tx = await provider.getTransaction(txHash);
        return {
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            //value: ethers.utils.formatEther(tx.value),
            //gasPrice: ethers.utils.formatEther(tx.gasPrice),
            //gasLimit: tx.gasLimit,
            nonce: tx.nonce,
            blockNumber: tx.blockNumber
        }
    }));
    res.json(txData);
  });

module.exports = router;