require('app-module-path').addPath(__dirname);

var args = require('minimist')(process.argv.slice(2));

var express = require('express');
var passport = require('passport');
var session = require('express-session');

var app = express();

var inventory_router = require('api/inventory.js');
var reservations_router = require('api/reservations.js');
var auth = require('api/auth.js');
var users_router = require('api/users.js');

var auth_router = auth.router;
var ensureAuthenticated = auth.ensureAuthenticated;

if(!args.no_https) {
    app.use(require('helmet')());
}

/* Setup session middleware */
app.use(session({ secret: 'a secret key', secure: !args.no_https }));
app.use(passport.initialize());
app.use(passport.session());

app.use('/api', auth_router);       /* Auth requests aren't behind the authentication barrier themselves */
app.use('/public', express.static('public'));  /* For serving the login page, etc. */

app.get('/', (req, res) => {
    if(req.user) { res.redirect('/inventory.html'); }
    else { res.redirect('/public/login.html'); }
});

/* API requests below this need to be authenticated */
app.use(ensureAuthenticated);

app.use('/api', users_router);
app.use('/api', inventory_router);
app.use('/api', reservations_router);
app.use(express.static('static'));

var http_port = (args.http_port || 80);
var https_port = (args.https_port || 443);

/* Create PID file */
var npid = require('npid');

try {
    var pid = npid.create('/var/run/parttracker.pid');
    pid.removeOnExit();
} catch (err) {
    console.log(err);
    process.exit(1);
}

if(args.no_https) {
    app.listen(http_port, () => {
        console.log("Server listening on port "+http_port.toString()+".");
    });
} else {
    // Let's Encrypt+CertBot support and TLS options here!
    var fs = require('fs');
    var http = require('http');
    var https = require('https');

    const tls_options = {
        ca: fs.readFileSync(args.le_cert_path+"/chain.pem"),
        cert: fs.readFileSync(args.le_cert_path+"/fullchain.pem"),
        key: fs.readFileSync(args.le_cert_path+"/privkey.pem"),

        /*
        ca: fs.readFileSync('/etc/letsencrypt/live/'+certDomain+"/chain.pem"),
        cert: fs.readFileSync('/etc/letsencrypt/live/'+certDomain+"/fullchain.pem"),
        key: fs.readFileSync('/etc/letsencrypt/live/'+certDomain+"/privkey.pem"),
        */
    }

    https.createServer(tls_options, app).listen(https_port, () => {
        console.log("Main app server listening on port "+https_port.toString()+".");
    });

    // plain HTTP server for http-01 challenge support; redirects all other requests to HTTPS
    var challenge_app = express();
    challenge_app.use('/.well-known/acme-challenge', express.static('acme-static/.well-known/acme-challenge'));
    challenge_app.use((req, res) => { res.redirect('https://'+req.hostname+req.url); });

    challenge_app.listen(http_port, () => {
        console.log("ACME challenge verification server listening on port "+http_port.toString()+".");
    });
}
