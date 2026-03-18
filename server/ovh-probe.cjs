const https = require('https');
const fs = require('fs');

const url = 'https://eu-west-par.okms.ovh.net/api/366b15e5-c9af-49ac-9f91-4cafa3fd8a51/v1/servicekey/5cacfa6f-4056-40dc-82bb-3eb828ec532e/encrypt';
const body = JSON.stringify({ plaintext: 'dGVzdA==', context: 'coachscribe-user-ark' });

const req = https.request(url, {
  method: 'POST',
  cert: fs.readFileSync('A:/Code/Coachscribe/server/ovh-client-cert.pem'),
  key: fs.readFileSync('A:/Code/Coachscribe/server/ovh-client-key.pem'),
  headers: {
    'content-type': 'application/json',
    'content-length': Buffer.byteLength(body),
  },
}, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('HTTP', res.statusCode);
    console.log(data);
  });
});

req.on('error', (err) => {
  console.error(err.message);
  process.exit(1);
});

req.write(body);
req.end();
