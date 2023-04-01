const { spawn, spawnSync }  = require('child_process');
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

const waitForWasp = async () => {
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

const execute = (bin, args) => spawnSync(bin, args, {stdio: 'inherit', encoding: 'utf-8'})

//Deploy chain once wasp dashboard is active
console.log('Waiting for wasp to start...');
(async () => await waitForWasp())()
execute('/bin/bash', ['/app/scripts/create-wallet.sh']);

//Store chain id in application's memory
const CHAIN_ID = JSON.parse(fs.readFileSync('/app/wallet/wasp-cli.json')).chains.tangletunes
app.set("CHAIN_ID", CHAIN_ID)

//TODO: Remove
app.set("contract", "0x8fA1fc1Eec824a36fD31497EAa8716Fc9C446d51")
app.set("songs", {})

//Start distributor
//TODO: only run once contract address is confirmed
execute('/bin/bash', ['/app/scripts/setup-distributor.sh', app.get("CHAIN_ID"), app.get("contract")])
const distribution = spawn('/usr/bin/ttdistributor', ['distribute'], {cwd: "/app/wallet", stdio: 'inherit'})
const dist_closed = new Promise(resolve => distribution.on('exit', resolve))

app.all('*', (req, res) => {
	return res.status(404).send({
		message: '404 page not found'
	});
});

const server = app.listen(80, () => console.log('Server started on port 80'));

// Gracefull shutdown
const signals = {
    'SIGHUP': 1,
    'SIGINT': 2,
    'SIGTERM': 15
}

const shutdown = async (value) => {
    console.log('Deregistering songs.')
    distribution.kill('SIGINT')
    await dist_closed

    console.log("shutdown!");
    server.close(() => process.exit(128 + value))
};

Object.keys(signals).forEach((signal) => {
    process.on(signal, async () => {
        console.log(`process received a ${signal} signal`);
        await shutdown(signals[signal])
    });
});

