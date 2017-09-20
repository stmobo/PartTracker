require('app-module-path').addPath(__dirname);

var args = require('minimist')(process.argv.slice(2));

var winston = require('winston');

winston.setLevels(winston.config.syslog.levels);
winston.level = args.log_level ||'info';
winston.add(winston.transports.File, { filename: args.log_file || '/var/log/parttracker.log' });

if(!args.no_syslog) {
    require('winston-syslog').Syslog;
    winston.add(winston.transports.Syslog);
}

//winston.remove(winston.transports.Console);

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
app.use('/dist', express.static('public/dist')); /* For serving external dependencies (bootstrap / jquery / etc) */

// Fallback to CDN if these aren't stored locally
app.get('/dist/js/jquery.min.js', (req, res) => { res.redirect('https://code.jquery.com/jquery-3.2.1.min.js'); })
app.get('/dist/css/bootstrap.min.css', (req, res) => { res.redirect('https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css'); })
app.get('/dist/js/bootstrap.min.js', (req, res) => { res.redirect('https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js'); })

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
    var pid = npid.create(args.pid_file || '/var/run/parttracker.pid');
    pid.removeOnExit();
} catch (err) {
    console.log(err);
    process.exit(1);
}

if(args.no_https) {
    app.listen(http_port, () => {
        winston.log('info', "Server listening on port "+http_port.toString()+".");
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
    }

    https.createServer(tls_options, app).listen(https_port, () => {
        winston.log('info', "Main app server listening on port "+https_port.toString()+".");
    });

    // plain HTTP server for http-01 challenge support; redirects all other requests to HTTPS
    var challenge_app = express();
    challenge_app.use('/.well-known/acme-challenge', express.static('acme-static/.well-known/acme-challenge'));
    challenge_app.use((req, res) => { res.redirect('https://'+req.hostname+req.url); });

    challenge_app.listen(http_port, () => {
        winston.log('info', "ACME challenge verification server listening on port "+http_port.toString()+".");
    });
}
