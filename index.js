require('app-module-path').addPath(__dirname);

var args = require('minimist')(process.argv.slice(2));

if(!args.no_stackdriver) {
    try {
        require('@google-cloud/trace-agent').start();
    } catch(err) {
        console.log(`Could not start Stackdriver Trace agent: [${e.name}]: ${e.message}`);
    };
}

var winston = require('winston');
var uuidv1 = require('uuid/v1');

/* Configure winston before anything uses it */
winston.setLevels(winston.config.syslog.levels);
winston.level = args.log_level ||'info';
winston.add(winston.transports.File, { filename: args.log_file || '/var/log/parttracker.log' });

if(!args.no_stackdriver) {
    try {
        var stackdriver_transport = require('@google-cloud/logging-winston');
        winston.add(stackdriver_transport);
    } catch(err) {
        // log and continue
        winston.log('error', `Could not start Stackdriver Logging transport for Winston: [${e.name}]: ${e.message}`);
    };

}

if(!args.no_syslog) {
    try {
        require('winston-syslog').Syslog;
        winston.add(winston.transports.Syslog, {
            app_name: 'parttrackerd'
        });
    } catch(err) {
        // log and continue
        winston.log('error', `Could not start Syslog transport for Winston: [${e.name}]: ${e.message}`);
    };
}

//winston.remove(winston.transports.Console);

var express = require('express');
var passport = require('passport');
var session = require('express-session');
var compression = require('compression');
var multistream = require('multistream');
var fs = require('fs');

var app = express();

var common = require('api/routing_common.js');
var inventory_router = require('api/inventory.js');
var reservations_router = require('api/reservations.js');
var time_router = require('api/time_tracking.js');
var auth = require('api/auth.js');
var users_router = require('api/users.js');
var requests_router = require('api/inv_requests.js');

var auth_router = auth.router;
var ensureAuthenticated = auth.ensureAuthenticated;

if(!args.no_https) {
    app.use(require('helmet')());
}

/* Setup session middleware */
app.use(session({ secret: 'a secret key', secure: !args.no_https }));
app.use(passport.initialize());
app.use(passport.session());

app.use(compression()); /* Compress responses -- most / all of what we send is compressible */

app.use('/api', auth_router);       /* Auth requests aren't behind the authentication barrier themselves */

app.use('/dist', express.static('public/dist')); /* For serving external dependencies (bootstrap / jquery / etc) */
app.use('/dist/js', express.static('node_modules/jquery/dist'));
app.use('/dist', express.static('node_modules/bootstrap/dist'));

// Fallback to CDN if these aren't stored locally
app.get('/dist/js/jquery.min.js', (req, res) => { res.redirect('https://code.jquery.com/jquery-3.2.1.min.js'); })
app.get('/dist/css/bootstrap.min.css', (req, res) => { res.redirect('https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css'); })
app.get('/dist/js/bootstrap.min.js', (req, res) => { res.redirect('https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js'); })

app.get(['/', '/inventory', '/requests', '/activities', '/users'], (req, res, next) => {
    if(!req.user) { res.redirect('/login'); }
    else { next(); }
});

app.get(['/', '/inventory', '/requests', '/activities', '/users', '/login', '/single.html'], (req, res) => {
    res.status(200).sendFile(__dirname+'/static/single.html');
});

app.get('/css/single.css', (req, res) => {
    var cssStreams = [
        '/static/css/inventory.css',
        '/static/css/users.css',
        '/static/css/login.css',
        '/static/css/activities.css',
        '/static/css/common.css',
    ];

    cssStreams = cssStreams.map(
        fn => fs.createReadStream(__dirname + fn)
    )

    res.type('css').status(200);
    multistream(cssStreams).pipe(res);
});


app.use('/', express.static('static/'));
app.get('/service-worker.js', (req, res) => {
    res.status(200).sendFile(__dirname+'/static/js/service-worker.js');
});

/* API requests below this need to be authenticated */
app.use(ensureAuthenticated);

/* Logging middleware. */
app.use('/api', common.asyncMiddleware(
    async (req, res, next) => {
        req.uuid = uuidv1();
        var metadata = {
            uuid: req.uuid,
            method: req.method,
            url: req.originalUrl,
            remoteAddress: req.socket.remoteAddress,
            username: await req.user.username(),
        }

        /* Log message:
         * [method] [url] from [remoteAddress] as user [user]
         */
        winston.log('info', "%s %s from %s as user %s",
            req.method, req.originalUrl,
            req.socket.remoteAddress.toString(), await req.user.username(),
            metadata
        );

        next();
    }
));

app.use('/api', users_router);
app.use('/api', inventory_router);
app.use('/api', reservations_router);
app.use('/api', requests_router);
app.use('/api', time_router);

app.use((err, req, res, next) => {
    Promise.resolve(common.errorHandlingMiddleware(err, req, res, next));
});

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
    var http = require('http');
    var spdy = require('spdy'); // Provides server for HTTP/2, SPDY, and regular HTTPS

    const tls_options = {
        ca: fs.readFileSync(args.le_cert_path+"/chain.pem"),
        cert: fs.readFileSync(args.le_cert_path+"/fullchain.pem"),
        key: fs.readFileSync(args.le_cert_path+"/privkey.pem"),
    }

    spdy.createServer(tls_options, app).listen(https_port, () => {
        winston.log('info', "Main app server listening on port "+https_port.toString()+".");
    });

    // plain HTTP server for http-01 challenge support; redirects all other requests to HTTPS
    var challenge_app = express();
    challenge_app.use((req, res, next) => {
        winston.info(
            'Unencrypted %s request made to %s from %s',
            req.method, req.originalUrl, req.socket.remoteAddress.toString(),
            {
                method: req.method,
                url: req.originalUrl,
                remoteAddress: req.socket.remoteAddress.toString()
            }
        );

        next();
    });

    challenge_app.use('/.well-known/acme-challenge', express.static('acme-static/.well-known/acme-challenge'));
    challenge_app.use((req, res) => { res.redirect('https://'+req.hostname+req.url); });

    challenge_app.listen(http_port, () => {
        winston.log('info', "ACME challenge verification server listening on port "+http_port.toString()+".");
    });
}
