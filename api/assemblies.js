var express = require('express');
var monk = require('monk');
var bodyParser = require('body-parser');

var dbAPI = require('api/db.js');
var common = require('api/routing_common.js');

var Item = require('api/models/Item.js');
var Reservation = require('api/models/Reservation.js');

var Assembly = require('api/models/Assembly.js').Assembly;
var Requirement = require('api/models/Assembly.js').Requirement;
var Link = require('api/models/Assembly.js').Link;

var router = express.Router();
router.use(bodyParser.json());

/************ GET Method Handlers *********************************************/

router.get('/assemblies', (req, res) => {
    return dbAPI.assemblies.find({}).then(
        (docs) => {
            promises = docs.map((doc) => { asm = new Assembly(doc._id); return asm.summary(); });
            return Promise.all(promises);
        }
    ).then(common.jsonSuccess(res)).catch(common.apiErrorHandler(req, res));
});

router.get('/assemblies/:asmid', (req, res) => {
    asm = new Assembly(monk.id(req.params.asmid));
    asm.exists(true).then(
        () => { return asm.summary(); }
    ).then(common.jsonSuccess(res)).catch(common.apiErrorHandler(req, res));
});

/**************** PUT Method handlers *****************************************/

router.put('/assemblies/:asmid', (req, res) => {
    common.checkRequestParameters(req, 'name', 'requirements', 'assigned', 'children', 'parent').then(
        () => {
            asm = new Assembly(monk.id(req.params.asmid));
            return asm.exists(true);    // Reject promise if nonexistent
        }
    ).then(
        (asm) => {
            asm.name(req.body.name);
            asm.assigned(req.body.assigned);

            return Promises.all([
                asm.requirements(req.body.requirements),
                asm.children(req.body.children),
                asm.parent(req.body.parent)
            ]).then(() => { return asm.save() });
        }
    ).then(
        (asm) => { return asm.summary(); }
    ).then(common.jsonSuccess(res)).catch(common.apiErrorHandler(req, res));
});

/**************** POST Method handlers ****************************************/

router.post('/assemblies', (req, res) => {
    common.checkRequestParameters(req, 'name', 'requirements', 'assigned', 'children', 'parent').then(
        () => {
            asm = new Assembly();

            asm.name(req.body.name);
            asm.assigned(req.body.assigned);

            return Promises.all([
                asm.requirements(req.body.requirements),
                asm.children(req.body.children),
                asm.parent(req.body.parent)
            ]).then(() => { return asm.save() });
        }
    ).then(
        (asm) => { return asm.summary(); }
    ).then(common.jsonSuccess(res)).catch(common.apiErrorHandler(req, res));
});

/**************** DELETE Method handlers **************************************/

router.delete('/assemblies/:asmid', (req, res) => {
    asm = new Assembly(monk.id(req.params.asmid));

    asm.exists(true).then(
        () => { return asm.delete(); }
    ).then(common.emptySuccess(res)).catch(common.apiErrorHandler(req, res));
});

module.exports = router;
