var express = require('express');
var monk = require('monk');
var csv = require('csv');
var bodyParser = require('body-parser');

var dbAPI = require('api/db.js');
var common = require('api/routing_common.js');

var Item = require('api/models/Item.js');
var Reservation = require('api/models/Reservation.js');


var router = express.Router();
router.use(bodyParser.json());
router.use(bodyParser.text({
    type: 'text/csv'
}));

function sendItemSummaries(res, out_type, summaries) {
    if(out_type === 'json') {
        res.status(200).json(summaries);
    } else if(out_type === 'text/csv') {
        csv.stringify(
            summaries,
            {
                columns: ['id', 'name', 'count', 'reserved', 'available', 'created', 'updated'],
                header: true,
                formatters: {
                    date: (d) => d.toISOString()
                },
            },
            (err, data) => {
                res.set('Content-Disposition', 'attachment; filename="inventory.csv"');
                res.status(200).type('text/csv').send(data);
            }
        );
    }
}

/* Method handlers: */
router.get('/inventory(.csv)?', common.asyncMiddleware(
    async (req, res) => {
        if(req.path === '/inventory.csv') {
            var out_type = req.accepts('text/csv');
        } else {
            var out_type = req.accepts(['json', 'text/csv']);
        }

        if(!out_type)
            throw new common.APIClientError(406, "Request must Accept either CSV or JSON format data.");

        var docs = await dbAPI.inventory.find({}, {});
        var summaries = await Promise.all(docs.map(
            (doc) => {
                var item = new Item(doc._id);
                return item.summary();
            }
        ));

        sendItemSummaries(res, out_type, summaries);
    }
));

/* Completely replaces the inventory collection. */
router.put('/inventory', common.asyncMiddleware(
    async (req, res) => {
        if(!(await req.user.admin())) throw new common.APIClientError(403, "Only administrators are allowed to import inventory data.");

        var in_type = req.is(['json', 'text/csv']);
        if(!in_type)
            throw new common.APIClientError(415, "Request payload must either be in CSV or JSON format.");

        if(in_type === 'text/csv') {
            var dataPromise = new Promise((resolve, reject) => {
                csv.parse(
                    req.body,
                    { columns: true, auto_parse: true },
                    (err, parsedData) => {
                        if(err) return reject(err);
                        return resolve(parsedData);
                    }
                );
            });

            var data = await dataPromise;
        } else {
            var data = req.body;
        }

        /* Delete all old items. */
        var oldDocs = await dbAPI.inventory.find({}, {});
        await Promise.all(oldDocs.map(
            (doc) => {
                var item = new Item(doc._id);
                return item.delete();
            }
        ));

        /* Create and save new items. */
        var summaries = await Promise.all(data.map(async (userDoc) => {
            var userItem = new Item();
            await Promise.all([
                await userItem.name(userDoc.name),
                await userItem.count(userDoc.count)
            ]);

            await userItem.save();

            return userItem.summary();
        }));

        sendItemSummaries(res, in_type, summaries);
    }
));

/*
 Add a new inventory item.

 Send parameters as JSON:
  - 'name': name of item type
  - 'count': initial inventory count
 */
router.post('/inventory', function(req, res) {
    common.checkRequestParameters(req, 'name', 'count').then(
        () => { return dbAPI.inventory.count( { name: req.body.name } ); }
    ).then(
        (count) => {
            if(count > 0) {
                return Promise.reject("Item already exists.");
            } else {
                item = new Item();

                item.name(req.body.name);
                item.count(req.body.count);

                return item.save();
            }
        }
    ).then(common.sendJSON(res, 201)).catch(common.apiErrorHandler(req, res));
});

/* Get information on one inventory item. */
router.get('/inventory/:id', function(req, res) {
    var item = new Item(monk.id(req.params.id));

    item.exists().then(
        (exists) => {
            if(exists) {
                return item.summary();
            } else {
                return Promise.reject("Item does not exist.");
            }
        }
    ).then(common.jsonSuccess(res)).catch(common.apiErrorHandler(req, res));
});

router.delete('/inventory/:id', function(req, res) {
    item = new Item(monk.id(req.params.id));

    item.delete().then(common.emptySuccess(res)).catch(common.apiErrorHandler(req, res));
});

/* Update an inventory item. */
router.put('/inventory/:id', function(req, res) {
    var item = new Item(monk.id(req.params.id));

    common.checkRequestParameters(req, 'name', 'count').then(
        () => { return item.reserved(); }
    ).then(
        (rsvp_count) => {
            if(rsvp_count > req.body.count)
                return Promise.reject("Cannot satisfy reservations with lowered inventory count.");

            item.name(req.body.name);
            item.count(parseInt(req.body.count));

            return item.save();
        }
    ).then(common.jsonSuccess(res)).catch(common.apiErrorHandler(req, res));
});

/* Get info on part reservations. */
router.get('/inventory/:id/reservations', (req, res) => {
    var item = new Item(monk.id(req.params.id));

    item.reservations().then(
        (ids) => {
            /* Convert all RSVPs to (promises for) summaries */
            return Promise.all(ids.map(
                (id) => {
                    rsvp = new Reservation(id);
                    return rsvp.summary();
                }
            ));
        }
    ).then(common.jsonSuccess(res)).catch(common.apiErrorHandler(req, res));
});

/* Redirect all part-specific reservation requests to the reservation route */
router.all('/inventory/:id/reservations/:rid*', (req, res) => {
    // find subroute:
    subroute = req.path.split('/inventory/'+req.params.id+'/reservations/'+req.params.rid);

    if(subroute.length > 1) {
        res.redirect(307, req.baseUrl+'/reservations/'+req.params.rid+subroute[1]);
    } else {
        res.status(404).send("Could not split path.");
    }
});
router.post('/inventory/:id/reservations', (req, res) => {
    res.redirect(307, req.baseUrl+'/reservations');
});
router.put('/inventory/:id/reservations', (req, res) => {
    res.redirect(307, req.baseUrl+'/reservations');
});
router.delete('/inventory/:id/reservations', (req, res) => {
    res.redirect(307, req.baseUrl+'/reservations');
});

module.exports = router;
