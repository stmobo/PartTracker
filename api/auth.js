var express = require('express');
var monk = require('monk');
var bodyParser = require('body-parser');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var BasicStrategy = require('passport-http').Strategy;

var dbAPI = require('api/db.js');
var common = require('api/routing_common.js');
var User = require('api/models/User.js');

/* NOTE: maybe find a different way to do this? */
const initialUserName = 'admin';
const initialRealName = 'Initial User';
const initialPassword = 'changemenow';

/* Create an initial user if necessary */
dbAPI.findOne({ username: initialUserName }).then(
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
            if(doc === null)
                return done(null, false, 'User not found.');

            if(doc.disabled)
                return done(null, false, 'Login for user disabled.');

            var user = new User(doc._id);
            return user.fetch();
        }
    ).then(
        (user) => { return Promise.all([user.validatePassword(password), user]); }
    ).then(
        (retns) => {
            var pw_valid = retns[0];
            var user = retns[1];

            if(pw_valid)
                return done(null, user);
            else
                return done(null, false, 'Incorrect password.');
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
    passport.authenticate('local'),
    (req, res) => {
        req.user.summary().then(common.jsonSuccess(res)).catch(common.apiErrorHandler(req, res));
    }
);

function authMiddleware(req, res, next) {
    if(req.user) {
        /* User is already authenticated, let them through */
        next();
    } else {
        /* Attempt HTTP-Basic authentication w/o sessions */
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
