#!/usr/bin/env node

import dns from 'dns';
import https from 'https';

const domain = 'aboyandhisdog.colin-mark.com';
const target = 'a-boy-and-his-dog.netlify.app';

console.log(`Checking DNS and HTTPS for ${domain}...`);
console.log('='.repeat(50));

// Check DNS CNAME record
dns.resolveCname(domain, (err, addresses) => {
  if (err) {
    console.log(`❌ DNS CNAME: Not yet configured (${err.code})`);
  } else {
    console.log(`✅ DNS CNAME: ${addresses[0]}`);
    if (addresses[0] === target) {
      console.log(`✅ DNS Target: Points to correct target (${target})`);
    } else {
      console.log(`❌ DNS Target: Points to ${addresses[0]}, should be ${target}`);
    }
  }
});

// Check HTTPS availability
const checkHttps = () => {
  const req = https.request(`https://${domain}`, { timeout: 5000 }, (res) => {
    console.log(`✅ HTTPS: Site accessible (Status: ${res.statusCode})`);
    console.log(`✅ SSL: Certificate working`);
  });

  req.on('error', (err) => {
    console.log(`❌ HTTPS: Not yet accessible (${err.message})`);
  });

  req.on('timeout', () => {
    console.log(`❌ HTTPS: Request timed out`);
  });

  req.end();
};

// Wait a moment for DNS check, then check HTTPS
setTimeout(checkHttps, 2000);

console.log('\nTo run this check again, use: node check-domain.js');
