require('app-module-path').addPath(__dirname);

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

/* Setup session middleware */
app.use(session({ secret: 'a secret key', cookie: { secure: false } }));
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

app.listen(3000, () => {
    console.log("Server listening on port 3000.");
});
