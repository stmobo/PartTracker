var express = require('express');
var monk = require('monk');
var bodyParser = require('body-parser');

var dbAPI = require('api/db.js');
var common = require('api/routing_common.js');

var User = require('api/models/User.js');
var Activity = require('api/models/Activity.js');

var router = express.Router();
router.use(bodyParser.json());

/*
 * Route: GET /activities -- Retrieve list of all activities.
 * Requires no parameters.
 */
router.get('/activities', common.asyncMiddleware(
    async (req, res) => {
        let activitiesList = await dbAPI.activities.find({}, {});
        let summaries = await Promise.all(activitiesList.map((doc) => {
            act = new Activity(doc._id);
            return act.summary();
        }));

        res.status(200).json(summaries);
    }
));

/*
 * Route: POST /activities -- create a new Activity.
 * Requires:
 * - 'title' [string]
 * - 'description' [string]
 * - 'startTime' [Date]
 * - 'endTime' [Date]
 * - 'maxHours' [double]
 */
router.post('/activities', common.asyncMiddleware(
    async (req, res) => {
        if(!await req.user.activityCreator()) return Promise.reject("User is not authorized to create Activities.");

        var exists = (await dbAPI.activities.count( {title: req.body.title}) > 0);
        if(exists) return Promise.reject("Activity already exists.");

        await common.checkRequestParameters(req, 'title', 'description', 'startTime', 'endTime', 'maxHours');

        var newActivity = new Activity();
        newActivity.title(req.body.title);
        newActivity.description(req.body.description);

        await newActivity.userHours([]); // must be set before maxHours to prevent a bug
        await Promise.all([
            newActivity.startTime(new Date(req.body.startTime)),
            newActivity.endTime(new Date(req.body.endTime)),
            newActivity.maxHours(req.body.maxHours),
        ]);

        await newActivity.save();
        res.status(201).json(await newActivity.summary());
    }
));

/* Middleware for getting the Activity object corresponding to :aid. */
router.use('/activities/:aid', common.asyncMiddleware(
    async (req, res, next) => {
        var activity = new Activity(monk.id(req.params.aid));
        if(!(await activity.exists())) return Promise.reject("Activity does not exist.");

        req.activity = activity;
        next();
    }
));

/*
 * Route: GET /activities/:aid -- get a specific Activity.
 * Requires no parameters.
 */
router.get('/activities/:aid', common.asyncMiddleware(
    async (req, res) => { res.status(200).json(await req.activity.summary()); }
));

/*
 * Route: PUT /activities/:aid -- update a specific Activity.
 * All parameters are optional: see POST /activities for a list of potential options / parameters
 */
router.put('/activities/:aid', common.asyncMiddleware(
    async (req, res) => {
        if(!await req.user.activityCreator()) return Promise.reject("User is not authorized to modify Activities.");

        if(req.body.title) req.activity.title(req.body.title);
        if(req.body.description) req.activity.description(req.body.description);
        if(req.body.maxHours) await req.activity.maxHours(req.body.maxHours);
        if(req.body.userHours) await req.activity.userHours(req.body.userHours);
        if(req.body.startTime) await req.activity.startTime(new Date(req.body.startTime));
        if(req.body.endTime) await req.activity.endTime(new Date(req.body.endTime));

        await req.activity.save();
        res.status(200).json(await req.activity.summary());
    }
));

/*
 * Route: DELETE /activities/:aid -- delete an Activity.
 * This route takes no parameters.
 */
router.delete('/activities/:aid', common.asyncMiddleware(
    async (req, res) => {
        if(!await req.user.activityCreator()) return Promise.reject("User is not authorized to modify Activities.");

        await req.activity.delete();
        res.status(204).end();
    }
));

/*
 * Route: GET /activities/:aid/checkin -- check the current user into an Activity.
 * This route takes no parameters.
 */
router.get('/activities/:aid/checkin', common.asyncMiddleware(
    async (req, res) => {
        var userHours = await req.activity.userHours();
        var idx = userHours.findIndex(doc => monk.id(doc.user) === monk.id(req.user.id()));

        if(idx !== -1) return Promise.reject("User "+req.user.id()+" has already checked into this Activity.");

        var maxHours = await req.activity.maxHours();
        var checkinObject = {
            user: req.user.id(),
            hours: maxHours,
            checkIn: new Date(),
        };
        userHours.push(checkinObject);

        await req.activity.userHours(userHours);
        await req.activity.save();

        res.status(201).json(checkinObject);
    }
));

/*
 * Collection: /activities/:aid/users[/:uid] -- Contains user sign-ins / hours for this Activity.
 */
router.use('/activities/:aid/users', common.asyncMiddleware(
    async (req, res, next) => {
        req.userHours = await req.activity.userHours();
        next();
    }
));

router.get('/activities/:aid/users', common.asyncMiddleware(
    async (req, res) => { res.status(200).json(req.userHours); }
));

router.put('/activities/:aid/users', common.asyncMiddleware(
    async (req, res) => {
        if(!await req.user.activityCreator()) return Promise.reject("User is not authorized to modify Activities.");
        if(!(req.body instanceof Array)) return Promise.reject("Sent object is not an array.");

        await req.activity.userHours(req.body);
        await req.activity.save();
        res.status(200).json(await req.activity.userHours());
    }
));

router.post('/activities/:aid/users', common.asyncMiddleware(
    async (req, res) => {
        await common.checkRequestParameters(req, 'user', 'hours', 'checkIn');

        req.userHours.push({
            user: req.body.user,
            hours: req.body.hours,
            checkIn: req.body.checkIn
        });

        await req.activity.userHours(req.userHours);
        await req.activity.save();

        res.status(200).json(await req.activity.userHours());
    }
));

router.delete('/activities/:aid/users', common.asyncMiddleware(
    async (req, res) => {
        await req.activity.userHours([]);
        await req.activity.save();

        res.status(204).end();
    }
));

/* Begin collection element-specific stuff */
router.use('/activities/:aid/users/:uid', common.asyncMiddleware(
    async (req, res, next) => {
        var user = new User(monk.id(req.params.uid));
        if(!await user.exists()) return Promise.reject("User "+req.params.uid+" does not exist.");

        var targetIndex = req.userHours.findIndex(doc => monk.id(doc.user).toString() === monk.id(req.params.uid).toString() );
        if(targetIndex === -1) return Promise.reject("No hours entry found for user "+req.params.uid+".");

        req.targetUser = user;
        req.targetIndex = targetIndex;
        next();
    }
))

router.get('/activities/:aid/users/:uid', common.asyncMiddleware(
    async (req, res) => {
        res.status(200).json(req.userHours[req.targetIndex]);
    }
));

router.put('/activities/:aid/users/:uid', common.asyncMiddleware(
    async (req, res) => {
        if(!await req.user.activityCreator()) return Promise.reject("User is not allowed to modify Activities.");

        if(req.body.user) {
            var user = new User(monk.id(req.body.user));
            if(!await user.exists()) return Promise.reject("User "+req.body.user+" does not exist.");
        }

        if(req.body.user) req.userHours[req.targetIndex].user = req.body.user;
        if(req.body.hours) req.userHours[req.targetIndex].hours = req.body.hours;
        if(req.body.checkIn) req.userHours[req.targetIndex].checkIn = new Date(req.body.checkIn);

        await req.activity.userHours(req.userHours);
        await req.activity.save();

        res.status(200).json(req.userHours[req.targetIndex]);
    }
));

router.delete('/activities/:aid/users/:uid', common.asyncMiddleware(
    async (req, res) => {
        if(!await req.user.activityCreator()) return Promise.reject("User is not allowed to modify Activities.");
        req.userHours.splice(req.targetIndex, 1);

        await req.activity.userHours(req.userHours);
        await req.activity.save();

        res.status(204).end();
    }
));

module.exports = router;
