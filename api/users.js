var express = require('express');
var monk = require('monk');
var bodyParser = require('body-parser');

var dbAPI = require('api/db.js');
var common = require('api/routing_common.js');

var User = require('api/models/User.js');

var router = express.Router();
router.use(bodyParser.json());

router.get('/user',
    (req, res, next) => {
        req.user.summary().then(common.jsonSuccess(res)).catch(next);
    }
);

router.post('/user/password',
    (req, res, next) => {
        req.user.setPassword(req.body.password).then(
            () => { return req.user.save(); }
        ).then(
            () => { req.logout(); }
        ).then(common.emptySuccess(res)).catch(next);
    }
)

/* Get listing of all users. This isn't restricted to administrators, though it does require authentication. */
router.get('/users',
    (req, res, next) => {
        dbAPI.users.find({}, {}).then(
            (docs) => {
                promises = docs.map(
                    (doc) => {
                        user = new User(doc._id);
                        return user.summary();
                    }
                );

                return Promise.all(promises);
            }
        ).then(common.jsonSuccess(res)).catch(next);
    }
);

/* The /users endpoints are restricted to administrators only. */
router.use('/users',
    (req, res, next) => {
        req.user.admin().then(
            (isAdmin) => {
                if(isAdmin) { next(); }
                else {
                    next(new common.APIClientError(401, "This endpoint is restricted to administrators."));
                }
            }
        );
    }
);


/* Add a new user.
 * Required parameters (all self-explanatory):
 *  username [string]
 *  password [string]
 *  realname [string]
 *  admin [boolean]
 *  disabled [boolean]
 */
router.post('/users',
    (req, res, next) => {
        common.checkRequestParameters(req, 'username', 'password', 'realname', 'activityCreator', 'admin', 'disabled').then(
            () => {
                var user = new User();

                user.username(req.body.username);
                user.realname(req.body.realname);
                user.activityCreator(req.body.activityCreator);
                user.admin(req.body.admin);
                user.disabled(req.body.disabled);

                return user.setPassword(req.body.password).then( () => { return user.save(); } );
            }
        ).then(
            (user) => { return user.summary(); }
        ).then(common.sendJSON(res, 201)).catch(next);
    }
);

router.use('/users/:uid',
    (req, res, next) => {
        /* Get the referenced user object already */
        user = new User(monk.id(req.params.uid));

        user.exists().then(
            (exists) => {
                if(!exists) {
                    return Promise.reject("User not found in database.");
                }
                req.targetUser = user;
                next();
            }
        ).catch(next);
    }
);

router.get('/users/:uid',
    (req, res, next) => {
        req.targetUser.summary().then(common.jsonSuccess(res)).catch(next);
    }
);

router.get('/users/:uid/activities', common.asyncMiddleware(
    async (req, res) => {
        res.status(200).json(await req.targetUser.getActivityHours());
    }
))

router.put('/users/:uid',
    (req, res, next) => {
        if(req.body.username) req.targetUser.username(req.body.username);
        if(req.body.realname) req.targetUser.realname(req.body.realname);
        if(req.body.activityCreator !== undefined) req.targetUser.activityCreator(req.body.activityCreator);
        if(req.body.admin !== undefined) req.targetUser.admin(req.body.admin);
        if(req.body.disabled !== undefined) req.targetUser.disabled(req.body.disabled);

        req.targetUser.save().then(
            () => { return req.targetUser.summary(); }
        ).then(common.jsonSuccess(res)).catch(next);
    }
);

router.delete('/users/:uid',
    (req, res, next) => { req.targetUser.delete().then(common.emptySuccess(res)).catch(next); }
);

router.post('/users/:uid/password',
    (req, res, next) => {
        common.checkRequestParameters(req, 'password').then(
            () => { return req.targetUser.setPassword(req.body.password); }
        ).then(
            () => { return req.targetUser.save(); }
        ).then(
            () => { return req.targetUser.summary(); }
        ).then(common.jsonSuccess(res)).catch(next);
    }
);

module.exports = router;
