var express = require('express');
var monk = require('monk');
var bodyParser = require('body-parser');

var dbAPI = require('api/db.js');
var common = require('api/routing_common.js');

var Item = require('api/models/Item.js');
var InventoryRequest = require('api/models/InventoryRequest.js');
var User = require('api/models/User.js');

var router = express.Router();
router.use(bodyParser.json());

router.get('/requests', common.asyncMiddleware(
    async (req, res) => {
        var requestList = await dbAPI.requests.find({}, {});
        var summaries = await Promise.all(requestList.map(
            (doc) => {
                var request = new InventoryRequest(doc._id);
                return request.summary();
            }
        ));

        res.status(200).json(summaries);
    }
));

router.post('/requests', common.asyncMiddleware(
    async (req, res) => {
        await common.checkRequestParameters(req, 'item', 'requester', 'count', 'status', 'eta');

        var invRQ = new InventoryRequest();

        await Promise.all([
            invRQ.item(req.body.item),
            invRQ.requester(req.body.requester),
            invRQ.count(req.body.count),
            invRQ.status(req.body.status),
            invRQ.eta(req.body.eta)
        ]);

        await invRQ.save();
        res.status(201).json(await invRQ.summary());
    }
));

router.use('/requests/:qid', common.asyncMiddleware(
    async (req, res, next) => {
        var targetRQ = new InventoryRequest(req.params.qid);
        if(!(await targetRQ.exists())) throw new Error("Request does not exist.");

        req.invRQ = targetRQ;
        next();
    }
));

router.get('/requests/:qid', common.asyncMiddleware(
    async (req, res) => { res.status(200).json(await req.invRQ.summary()); }
));

router.put('/requests/:qid', common.asyncMiddleware(
    async (req, res) => {
        if(req.body.item !== undefined) await req.invRQ.item(req.body.item);
        if(req.body.requester !== undefined) await req.invRQ.requester(req.body.requester);
        if(req.body.count !== undefined) await req.invRQ.count(req.body.count);
        if(req.body.status !== undefined) await req.invRQ.status(req.body.status);
        if(req.body.eta !== undefined) await req.invRQ.eta(req.body.eta);

        await req.invRQ.save();
        res.status(200).json(await req.invRQ.summary());
    }
));

router.delete('/requests/:qid', common.asyncMiddleware(
    async (req, res) => {
        await req.invRQ.delete();
        res.status(204).end();
    }
));

module.exports = router;
