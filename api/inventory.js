var express = require('express');
var monk = require('monk');
var bodyParser = require('body-parser');

var dbAPI = require('api/db.js');
var common = require('api/routing.js');

var Item = require('api/Item.js');
var Reservation = require('api/Reservation.js');

var router = express.Router();
router.use(bodyParser.json());

/* Method handlers: */

/* Return a listing of all inventory items. */
router.get('/inventory', function(req, res) {
    dbAPI.inventory.find({}, {}).then(
        (docs) => {
            promises = docs.map(
                (doc) => {
                    item = new Item(doc._id);
                    return item.summary();
                }
            );

            return Promise.all(promises);
        }
    ).then(common.jsonSuccess(res)).catch(common.apiErrorHandler(res));
});

/*
 Add a new inventory item.

 Send parameters as JSON:
  - 'name': name of item type
  - 'count': initial inventory count
 */
router.post('/inventory', function(req, res) {
    if(!checkRequestParameter(req, res, 'name') || !checkRequestParameter(req, res, 'count')) {
        return;
    }

    dbAPI.inventory.count( { name: req.body.name } ).then(
        (count) => {
            if(count > 0) {
                return Promise.reject("Item already exists.");
            } else {
                item = new Item(req.body.name, req.body.count);
                return item.save();
            }
        }
    ).then(common.sendJSON(res, 201)).catch(common.apiErrorHandler(res));
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
    ).then(common.jsonSuccess(res)).catch(common.apiErrorHandler(res));
});

router.delete('/inventory/:id', function(req, res) {
    item = new Item(monk.id(req.params.id));

    item.delete().then(common.emptySuccess(res)).catch(common.apiErrorHandler(res));
});

/* Update an inventory item. */
router.put('/inventory/:id', function(req, res) {
    if(!checkRequestParameter(req, res, 'name')) { return; }
    if(!checkRequestParameter(req, res, 'count')) { return; }

    var item = new Item(monk.id(req.params.id));

    common.checkRequestParameters(req, 'name', 'count').then(
        () => { return item.reserved(); }
    ).then(
        (rsvp_count) => {
            if(rsvp_count > req.body.count)
                return Promise.reject("Cannot satisfy reservations with lowered inventory count.");

            this.name(req.body.name);
            this.count(parseInt(req.body.count));

            return this.save();
        }
    ).then(common.jsonSuccess(res)).catch(common.apiErrorHandler(res));
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
    ).then(common.jsonSuccess(res)).catch(common.apiErrorHandler(res));
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
