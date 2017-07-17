var express = require('express');
var monk = require('monk');
var bodyParser = require('body-parser');
var passport = require('passport');
var LocalStrategy = require('passport-local');
var BasicStrategy = require('passport-http').BasicStrategy;

var dbAPI = require('api/db.js');
var common = require('api/routing_common.js');
var User = require('api/models/User.js');

/* NOTE: maybe find a different way to do this? */
const initialUserName = 'admin';
const initialRealName = 'Initial User';
const initialPassword = 'changemenow';

/* Create an initial user if necessary */
dbAPI.users.findOne({ username: initialUserName }).then(
    (doc) => {
        if(doc !== null)
            return;

        var initUser = new User();
        initUser.username(initialUserName);
        initUser.realname(initialRealName);
        initUser.admin(true);
        initUser.disabled(false);

        return initUser.setPassword(initialPassword).then(
            () => { return initUser.save(); }
        );
    }
);


function usernamePasswordAuth(username, password, done) {
    dbAPI.users.findOne({username: username}).then(
        (doc) => {
            if(doc === null) {
                //console.log("Unknown user " + username + " attempted to authenticate.");
                return done(null, false, {message: 'User not found.'});
            }


            if(doc.disabled) {
                //console.log("Disabled user " + username + " attempted to authenticate.");
                return done(null, false, {message: 'Login for user disabled.'});
            }

            return new User(doc._id);
        }
    ).then(
        (user) => { return Promise.all([user.validatePassword(password), user.fetch()]); }
    ).then(
        (retns) => {
            var pw_valid = retns[0];
            var user = retns[1];

            if(pw_valid) {
                //console.log("User " + username + " authenticated successfully.");
                return done(null, user);
            } else {
                //console.log("User " + username + " attempted to authenticate with an invalid password.");
                return done(null, false, {message: 'Incorrect password.'});
            }
        }
    ).catch(
        (err) => { return done(err); }
    );
}

passport.use(new LocalStrategy(usernamePasswordAuth));
passport.use(new BasicStrategy(usernamePasswordAuth));

passport.serializeUser(
    (user, done) => {
        return done(null, user.id());
    }
);

passport.deserializeUser(
    (id, done) => {
        var userObj = new User(id);

        userObj.fetch().then(
            (user) => { return done(null, user); }
        ).catch(
            (err) => { return done(err); }
        );
    }
);

/* Authentication endpoint */
var router = express.Router();
router.use(bodyParser.json());
router.use(bodyParser.urlencoded());

router.post('/login',
    (req, res, next) => {
        passport.authenticate(['local', 'basic'],
            (err, user, info) => {
                if(err) { return next(err); }
                if(!user) { return res.status(401).json(info); }
                req.login(user, (err) => {
                    if(err) { return next(err); }
                    return user.summary().then(common.jsonSuccess(res)).catch(common.apiErrorHandler(req, res));
                });
            }
        )(req, res, next);
    }
);

/* XXX: Debug only! THIS IS INSANELY INSECURE! */
router.post('/admin_pw',
    (req, res) => {
        dbAPI.users.findOne({ username: initialUserName }).then(
            (doc) => {
                return new User(doc._id);
            }
        ).then(
            (initUser) => {
                return initUser.setPassword(req.body.password).then(() => { return initUser.save(); });
            }
        ).then(
            (initUser) => { return initUser.summary(); }
        ).then(
            (summary) => { res.status(200).json(summary); }
        );
    }
);

function authMiddleware(req, res, next) {
    if(req.user) {
        /* User is already authenticated, let them through */
        //console.log(req.user.username + " requested " + req.originalUrl + " via " + req.method);
        next();
    } else {
        /* Attempt HTTP-Basic authentication w/o sessions */
        //console.log("Attempting basic authentication for " + req.originalUrl + " via " + req.method);
        passport.authenticate('basic', { session: false })(req, res, next);
    }
}

router.get('/logout',
    authMiddleware,
    (req, res) => {
        req.logout();
        res.status(204).end();
    }
);

module.exports = {
    router: router,
    ensureAuthenticated: authMiddleware
};
