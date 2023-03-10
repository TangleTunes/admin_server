const { execSync } = require('child_process');
const bodyParser   = require('body-parser');
const express      = require('express');
const path         = require('path');
const http         = require('http');
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/static', express.static(path.resolve('static')));

app.use('/admin', require('./routes/admin'));
app.use('/validator', require('./routes/validator'));
app.use('/debug', require('./routes/debug'));

app.all('/', (req, res) => res.redirect('/validator'));

app.all('*', (req, res) => {
	return res.status(404).send({
		message: '404 page not found'
	});
});

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

app.listen(3000, () => console.log('Server started on port 3000'));