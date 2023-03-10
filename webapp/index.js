const { ethers } = require('ethers');
const { execSync } = require('child_process');
const express = require('express');
const path = require('path');
const http = require('http');
const fs = require('fs');

function waitForWasp() {
  return new Promise((resolve, reject) => {
    http.get('http://wasp:7000/chains', async (res) => {
      (res.statusCode === 200) ? resolve() : await waitForWasp()
    }).on('error', (err) => {
      reject(err.message)
    }).end()
  })
}

//Deploy chain and smart contract 
(async () => {
  console.log('Waiting for server to start...')
  await waitForWasp()
})()
execSync('/bin/bash /app/scripts/create-wallet.sh');


const app = express();

let chainID = JSON.parse(fs.readFileSync('/app/wallet/wasp-cli.json')).chains.tangletunes
const provider = new ethers.JsonRpcProvider(`http://wasp:9090/chains/${chainID}/evm`, 1074)

app.get('/info', async (req, res) => {
  res.json({
    "json-rpc": `http://localhost:9090/chains/${chainID}/evm`,
    "chainID": 1074,
    "smart-contract": "TBD"
  });
});

app.get('/song', async (req, res) => {
  res.sendFile(path.join(__dirname, '/views/song.html'));
});

app.post('/song', async (req, res) => {
  let signer = new ethers.Wallet(req.body.key, provider);
  let abi = JSON.parse(fs.readFileSync('/tangletunes/abi.json'))
  let contract = new ethers.Contract(req.body.contract, abi, signer);
  let user = await contract.users(signer.address)
  if (user[0] === false) {

  }


  res.json({
    "user": r[0]
  })
});

app.get('/test', async (req, res) => {
  res.send(`
<h1> tittle</h1>
<p> para</p>
  `)
});

app.get('/faucet/:addr', async (req, res) => {
  try {
    execSync(`/bin/bash /app/scripts/request-funds.sh ${req.params.addr}`)
    res.json({"error": ""});
  } catch (err) {
    res.json({"error": err.stderr.toString()});
  }
});

app.get('/history', async (req, res) => {
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

app.listen(3000, () => {
  console.log('Server started on port 3000');
});