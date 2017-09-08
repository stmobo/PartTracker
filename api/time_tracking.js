var express = require('express');
var monk = require('monk');
var bodyParser = require('body-parser');

var dbAPI = require('api/db.js');
var common = require('api/routing_common.js');

var Activity = require('api/models/Activity.js');

var router = express.Router();
router.use(bodyParser.json());

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

router.post('/activities', common.asyncMiddleware(
  async (req, res) => {
    var exists = (await dbAPI.activities.count( {title: req.body.title}) > 0);
    if(exists) return Promise.reject("Activity already exists.");

    var newActivity = new Activity();
    newActivity.title(req.body.title);
    newActivity.description(req.body.description);
    newActivity.startTime(new Date(req.body.startTime));
    newActivity.endTime(new Date(req.body.endTime));
    newActivity.maxHours(req.body.maxHours);
    newActivity.open(req.body.open);

    return newActivity.save();
  }
));

router.get('/activities/:aid', common.asyncMiddleware(
  async (req, res) => {
    var reqObject = new Activity(req.params.aid);
    if(!await reqObject.exists()) return Promise.reject("Activity does not exist.");

    res.status(200).json(await reqObject.summary());
  }
));

router.put('/activities/:aid', common.asyncMiddleware(
  async (req, res) => {
    var reqObject = new Activity(req.params.aid);
    if(!await reqObject.exists()) return Promise.reject("Activity does not exist.");

    if(req.body.title) reqObject.title(req.body.title);
    if(req.body.description) reqObject.description(req.body.description);
    if(req.body.maxHours) reqObject.maxHours(req.body.maxHours);
    if(req.body.open) reqObject.open(req.body.open);
    if(req.body.userHours) reqObject.userHours(req.body.userHours);
    if(req.body.startTime) reqObject.startTime(new Date(req.body.startTime));
    if(req.body.endTime) reqObject.endTime(new Date(req.body.endTime));

    await reqObject.save();
    res.status(200).json(await reqObject.summary());
  }
));
