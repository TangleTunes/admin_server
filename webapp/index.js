const { createProxyMiddleware } = require('http-proxy-middleware');
const { execSync }  = require('child_process');
const cookieSession = require('cookie-session')
const bodyParser    = require('body-parser');
const express       = require('express');
const crypto        = require('crypto');
const path          = require('path');
const http          = require('http');
const fs            = require('fs');
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

app.use(cookieSession({
    name: 'session',
    keys: [crypto.randomBytes(64)],
    httpOnly: false,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

app.use('/static', express.static(path.resolve('static')));

app.use('/admin', require('./routes/admin'));
app.use('/validator', require('./routes/validator'));
app.use('/debug', require('./routes/debug'));
app.use('/', require('./routes/index'));

async function waitForWasp() {
  // wait one second
  await (new Promise(resolve => setTimeout(resolve, 1000)));
  // fetch wasp dashboard until request succeeds
  return new Promise((resolve, reject) => {
    http.get('http://wasp:7000/chains', async (res) => {
      (res.statusCode === 200) ? resolve() : await waitForWasp();
    }).on('error', (err) => {
      reject(err.message)
    }).end()
  });
}

//Deploy chain once wasp dashboard is active
console.log('Waiting for wasp to start...');
(async () => await waitForWasp())()
execSync('/bin/bash /app/scripts/create-wallet.sh');

//Proxy traffic to chain's JSON-RPC url
const CHAIN_ID = JSON.parse(fs.readFileSync('/app/wallet/wasp-cli.json')).chains.tangletunes
app.set("CHAIN_ID", CHAIN_ID)
app.use("/evm", createProxyMiddleware({
  target: `http://wasp:9090/chains/${CHAIN_ID}`
}));


//TODO: Remove
app.set("contract", "0xa57D405951896582EB0535f7566556FdEd498bD1")
app.set("songs", {})

app.all('*', (req, res) => {
	return res.status(404).send({
		message: '404 page not found'
	});
});

app.listen(80, () => console.log('Server started on port 80'));