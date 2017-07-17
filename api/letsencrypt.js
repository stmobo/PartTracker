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

function agreeToTOS(opts, agree_cb) {
    opts.email = certEmail;

    console.log("Getting certs for: " + opts.domains.toString());
    console.log("TOS URL at " + opts.tosUrl.toString());
    if(opts.domains.length > 1 || opts.domains[0] !== certDomain) {
        console.log("Cert domains don't match expected values, aborting!");
        return;
    }

    agree_cb(null, opts.tosUrl);
}

module.exports = function(app) {
    var le_xp = LE_express.create({
        server: LE.stagingServerUrl, // change to LE.productionServerUrl when ready
        store: leStore,
        challenges: {
            'http-01': leHTTPChallenge,
            'tls-sni-01': leSNIChallenge,
            'tls-sni-02': leSNIChallenge,
        },
        challengeType: 'tls-sni-01',
        agreeToTerms: agreeToTOS,
        approveDomains: [certDomain],
        email: certEmail,
        debug: true,
        app: app
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

    return {
        le_express: le_xp,
        do_cert_check: do_cert_check
    };
}
