var express = require('express');
var monk = require('monk');
var bodyParser = require('body-parser');
var passport = require('passport');
var LocalStrategy = require('passport-local');
var BasicStrategy = require('passport-http').BasicStrategy;

var dbAPI = require('api/db.js');
var common = require('api/routing_common.js');
var User = require('api/models/User.js');

var winston = require('winston');

/* NOTE: maybe find a different way to do this? */
const initialUserName = 'admin';
const initialRealName = 'Initial User';
const initialPassword = 'changemenow';

/* Create an initial user if necessary */
dbAPI.users.count({}).then(
    (count) => {
        if(count > 0)
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
                winston.log('info', "Rejected authentication as " + username + ": user not found.");
                return Promise.reject({message: 'User not found.'});
            }


            if(doc.disabled) {
                //console.log("Disabled user " + username + " attempted to authenticate.");
                winston.log('info', "Rejected authentication as " + username + ": login for user disabled.");
                return Promise.reject({message: 'Login for user disabled.'});
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
                winston.log('info', "Rejected authentication as " + username + ": invalid password.");
                return Promise.reject({message: 'Incorrect password.'});
            }
        }
    ).catch(
        (err) => {
            if(err instanceof Error) {
                return done(err);
            } else {
                done(null, false, err);
            }
        }
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

        return done(null, userObj);
        /*
        userObj.fetch().then(
            (user) => { return done(null, user); }
        ).catch(
            (err) => { return done(err); }
        );
        */
    }
);

/* Authentication endpoint */
var router = express.Router();
router.use(bodyParser.json());
router.use(bodyParser.urlencoded());

router.post('/login',
    (req, res, next) => {
        winston.log('info', req.socket.remoteAddress + " is attempting to log in...");
        passport.authenticate(['local', 'basic'],
            (err, user, info) => {
                if(err) { return next(err); }
                if(!user) { return res.status(401).json(info); }
                req.login(user, (err) => {
                    if(err) { return next(err); }

                    return user.summary().then(
                        (userInfo) => {
                            winston.log('info', req.socket.remoteAddress + " logged in as "+userInfo.username+".");
                            return userInfo;
                        }
                    ).then(common.jsonSuccess(res)).catch(next);
                });
            }
        )(req, res, next);
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
        if(req.get('Authorization') !== undefined) {
            winston.log('info', "Attempting HTTP-Basic authentication for " + req.socket.remoteAddress + ".");
            passport.authenticate('basic', { session: false })(req, res, next);
        } else {
            //res.status(401).send('Authentication is required to access this endpoint.');
            next(new common.APIClientError(
                401,
                'Authentication is required to access this endpoint.'
            ));
        }
    }
}

router.get('/logout',
    authMiddleware,
    common.asyncMiddleware(
        async (req, res) => {
            winston.log('debug', req.socket.remoteAddress + " logged out as "+(await req.user.username())+".");

            req.logout();
            res.status(204).redirect('/');
        }
    )
);

module.exports = {
    router: router,
    ensureAuthenticated: authMiddleware
};
