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

function do_cert_check() {
    le_xp.check({ domains: [ certDomain ] }).then(
        (results) => {
            if(results) { console.log("Found existing certs from Let's Encrypt."); return; } // do we already have certs?

            // we need to register certs
            console.log("Getting new certificates from Let's Encrypt...");
            le_xp.register({
                domains: [certDomain],
                email: certEmail,
                rsaKeySize: 2048,
                challengeType: 'tls-sni-01'
            }).then(
                (results) => {
                    console.log("Got a certificate for " + results.subject + " ("+results.altnames.toString()+")!");
                }
            ).catch(
                (err) => {
                    console.error("Error while retrieving certs: " + err.stack.toString());
                }
            );
        }
    );
}

module.exports = {
    le_express: le_xp,
    do_cert_check: do_cert_check
};
