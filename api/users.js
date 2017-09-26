var express = require('express');
var monk = require('monk');
var bodyParser = require('body-parser');

var dbAPI = require('api/db.js');
var common = require('api/routing_common.js');

var User = require('api/models/User.js');

var router = express.Router();
router.use(bodyParser.json());
router.use(bodyParser.text({
    type: 'text/csv'
}));

router.get('/user',
    (req, res) => {
        req.user.summary().then(common.jsonSuccess(res)).catch(common.apiErrorHandler(req, res));
    }
);

router.post('/user/password',
    (req, res) => {
        req.user.setPassword(req.body.password).then(
            () => { return req.user.save(); }
        ).then(
            () => { req.logout(); }
        ).then(common.emptySuccess(res)).catch(common.apiErrorHandler(req, res));
    }
)

/* Get listing of all users. This isn't restricted to administrators, though it does require authentication. */
router.get('/users(.csv)?', common.asyncMiddleware(
    async (req, res) => {
        if(req.path === '/users.csv') {
            var out_type = req.accepts('text/csv');
        } else {
            var out_type = req.accepts(['json', 'text/csv']);
        }

        if(!out_type)
            throw new common.APIClientError(406, "Request must Accept either CSV or JSON format data.");

        var promises = (await dbAPI.users.find({}, {})).map(
            (doc) => {
                user = new User(doc._id);
                return user.summary();
            }
        );
        var summaries = await Promise.all(promises);

        if(out_type == 'text/csv') {
            common.sendCSV(res, summaries, 'users.csv');
        } else {
            res.status(200).json(summaries);
        }
    }
));

/* The /users endpoints are restricted to administrators only. */
router.use('/users',
    (req, res, next) => {
        req.user.admin().then(
            (isAdmin) => {
                if(isAdmin) { next(); }
                else { res.status(401).send("This endpoint is restricted to administrators."); }
            }
        );
    }
);

/* Completely replaces / updates the Users collection. */
router.put('/users', common.asyncMiddleware(
    async (req, res) => {
        var in_type = req.is(['json', 'text/csv']);
        if(!in_type)
            throw new common.APIClientError(415, "Request payload must either be in CSV or JSON format.");

        if(in_type === 'text/csv') {
            var data = await common.parseCSV(req.body);
        } else {
            var data = req.body;
        }

        /* Make sure all passed in objects have all properties set. */
        const params = ['username', 'realname', 'password', 'admin', 'activityCreator', 'disabled'];
        for(let doc of data) {
            const propNames = Object.getOwnPropertyNames(doc);
            const missing = params.find(p => !propNames.includes(p));
            if(missing !== undefined) throw new common.APIClientError(400, `Request body is missing parameter: ${missing}`);
        }

        /* Get old and new username lists (also map usernames to User objects) */
        var oldUserList = (await dbAPI.users.find({}, {})).map(
            (doc) => { return new User(doc._id); }
        );

        var oldUsernames = [];
        var usernameMap = {};

        await Promise.all(oldUserList.map(
            async (user) => {
                var username = await user.username();
                oldUsernames.push(username);
                usernameMap[username] = user;
            }
        ));

        var newUsernames = data.map(
            (user) => { return user.username; }
        );

        /* Get differences between each list */
        var deletedUsers = oldUsernames.filter(x => !newUsernames.includes(x));
        var updatedUsers = oldUsernames.filter(x => newUsernames.includes(x));
        var addedUsers = newUsernames.filter(x => !oldUsernames.includes(x));

        /* Now update / delete / add users as necessary */
        var updates = updatedUsers.map(
            async (username) => {
                var user = usernameMap[username];
                var newData = data.find(x => x.username === username);

                user.realname(newData.realname);
                user.admin(newData.admin);
                user.disabled(newData.disabled);
                user.activityCreator(newData.activityCreator);
                await user.setPassword(newData.password);

                return user.save();
            }
        );

        var deletions = deletedUsers.map(
            (username) => {
                return usernameMap[username].delete()
            }
        );

        var additions = addedUsers.map(
            async (username) => {
                var user = new User();
                var newData = data.find(x => x.username === username);

                user.username(newData.username);
                user.realname(newData.realname);
                user.admin(newData.admin == 'true');
                user.disabled(newData.disabled == 'true');
                user.activityCreator(newData.activityCreator == 'true');
                await user.setPassword(newData.password);

                return user.save();
            }
        );

        await Promise.all(updates.concat(additions, deletions));

        var promises = (await dbAPI.users.find({}, {})).map(
            (doc) => {
                user = new User(doc._id);
                return user.summary();
            }
        );
        var summaries = await Promise.all(promises);

        if(in_type == 'text/csv') {
            common.sendCSV(res, summaries, 'users.csv');
        } else {
            res.status(200).json(summaries);
        }
    }
))


/* Add a new user.
 * Required parameters (all self-explanatory):
 *  username [string]
 *  password [string]
 *  realname [string]
 *  admin [boolean]
 *  disabled [boolean]
 */
router.post('/users',
    (req, res) => {
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
        ).then(common.sendJSON(res, 201)).catch(common.apiErrorHandler(req, res));
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
        ).catch(common.apiErrorHandler(req, res));
    }
);

router.get('/users/:uid',
    (req, res) => {
        req.targetUser.summary().then(common.jsonSuccess(res)).catch(common.apiErrorHandler(req, res));
    }
);

router.get('/users/:uid/activities', common.asyncMiddleware(
    async (req, res) => {
        res.status(200).json(await req.targetUser.getActivityHours());
    }
))

router.put('/users/:uid',
    (req, res) => {
        if(req.body.username) req.targetUser.username(req.body.username);
        if(req.body.realname) req.targetUser.realname(req.body.realname);
        if(req.body.activityCreator !== undefined) req.targetUser.activityCreator(req.body.activityCreator);
        if(req.body.admin !== undefined) req.targetUser.admin(req.body.admin);
        if(req.body.disabled !== undefined) req.targetUser.disabled(req.body.disabled);

        req.targetUser.save().then(
            () => { return req.targetUser.summary(); }
        ).then(common.jsonSuccess(res)).catch(common.apiErrorHandler(req, res));
    }
);

router.delete('/users/:uid',
    (req, res) => { req.targetUser.delete().then(common.emptySuccess(res)).catch(common.apiErrorHandler(req, res)); }
);

router.post('/users/:uid/password',
    (req, res) => {
        common.checkRequestParameters(req, 'password').then(
            () => { return req.targetUser.setPassword(req.body.password); }
        ).then(
            () => { return req.targetUser.save(); }
        ).then(
            () => { return req.targetUser.summary(); }
        ).then(common.jsonSuccess(res)).catch(common.apiErrorHandler(req, res));
    }
);

module.exports = router;
