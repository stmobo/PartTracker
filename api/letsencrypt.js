/* options and config for Let's Encrypt */

var LE = require('greenlock');
var LE_express = require('greenlock-express');

const certEmail = "";   // email for certs
const certDomain = "";      // Domain to get certs for

var leStore = require('le-store-certbot').create({
    configDir: '/etc/letsencrypt',
    debug: false
});

var leHTTPChallenge = require('le-challenge-fs').create({
    webrootPath: '/tmp/acme-challenge',
    debug: false
});

var leSNIChallenge = require('le-challenge-sni').create({
    debug: false
});

function approveDomains(opts, certs, agree_cb) {
    if(certs) {
        opts.domains = certs.altnames;
    } else {
        opts.email = certEmail;
        opts.agreeTos = true;
    }

    console.log("Getting certs for: " + opts.domains.toString());
    if(opts.domains.length > 1 || opts.domains[0] !== certDomain) {
        return;
    }

    cb(null, {options: opts, certs: certs});
}

var le_xp = LE_express.create({
    server: LE.stagingServerUrl, // change to LE.productionServerUrl when ready
    store: leStore,
    challenges: {
        'http-01': leHTTPChallenge,
        'tls-sni-01': leSNIChallenge,
        'tls-sni-02': leSNIChallenge,
    },
    challengeType: 'tls-sni-01',
    approveDomains: approveDomains,
    debug: false
});

module.exports = le_exp;
