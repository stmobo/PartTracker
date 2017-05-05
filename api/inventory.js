var express = require('express');
var monk = require('monk');
var bodyParser = require('body-parser');

var dbAPI = require('api/db.js');
var Item = require('api/Item.js');
var Reservation = require('api/Reservation.js');

var router = express.Router();
router.use(bodyParser.json());

function checkRequestParameter(req, res, key) {
    if(!(key in req.body)) {
        res.status(400).send("Missing parameter: \'"+key+"\". ");
        return false;
    }
    return true;
}

/* Method handlers: */

/* Return a listing of all inventory items. */
router.get('/inventory', function(req, res) {
    dbAPI.inventory.find({}, {}).then(
        (docs) => {
            promises = docs.map(
                (doc) => {
                    it = new Item(doc._id);
                    return it.summary();
                }
            );

            return Promise.all(promises);
        }
    ).then(
        (retn) => {
            res.status(200);
            res.json(retn);
        }
    ).catch(
        (err) => {
            res.status(500);
            res.send(err.toString());
        }
    );
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
                return Promise.reject("item exists already");
            } else {
                item = new Item(req.body.name, req.body.count);
                return item.save();
            }
        }
    ).then(
        (item) => { return item.summary(); }
    ).then(
        (summ) => {
            res.status(200).json(summ);
        }
    ).catch(
        (err) => {
            if(err instanceof Error) {
                // handle actual errors
                res.status(500);
                res.send(err.toString());
            } else if(err === "item exists already") {
                res.status(400);
                res.send(err);
            }
        }
    );
});

/* Get information on one inventory item. */
router.get('/inventory/:id', function(req, res) {
    var item = new Item(monk.id(req.params.id));

    item.exists().then(
        (exists) => {
            if(exists) {
                return item.summary();
            } else {
                return Promise.reject("item does not exist");
            }
        }
    ).then(
        (summ) => {
            res.status(200).json(summ);
        }
    ).catch(
        (err) => {
            if(err === "item does not exist") {
                res.status(400);
                res.send("Item does not exist within inventory.");
            } else {
                res.status(500);
                res.send(err.toString());
            }
        }
    );
});

router.delete('/inventory/:id', function(req, res) {
    item = new Item(monk.id(req.params.id));

    item.delete().then(
        () => {
            res.status(200);
            res.end();
        }
    ).catch(
        (err) => {
            res.status(500);
            res.send(err.toString());
        }
    );
});

/* Update an inventory item. */
router.put('/inventory/:id', function(req, res) {
    if(!checkRequestParameter(req, res, 'name')) { return; }
    if(!checkRequestParameter(req, res, 'count')) { return; }

    var item = new Item(monk.id(req.params.id));

    item.reserved().then(
        (rsvp_count) => {
            if(rsvp_count > req.body.count) {
                return Promise.reject("Cannot satisfy reservations with lowered inventory count.");
            }

            this.name(req.body.name);
            this.count(parseInt(req.body.count));

            return this.save();
        }
    ).then(
        (it) => { return it.summary(); }
    ).then(
        (summ) => {
            res.status(200);
            res.json(summ);
        }
    ).catch(
        (err) => {
            if(err === "Cannot satisfy reservations with lowered inventory count.") {
                res.status(400);
            } else {
                res.status(500);
            }

            res.send(err.toString());
        }
    );
});

/* Get info on part reservations. */
router.get('/inventory/:id/reservations', (req, res) => {
    var item = new Item(monk.id(req.params.id));

    item.reservations().then(
        (rsvps) => {
            /* Convert all RSVPs to (promises for) summaries */
            return Promise.all(rsvps.map((rsvp) => { return rsvp.summary(); }));
        }
    ).then(
        (summs) => {
            res.status(200);
            res.json(summs);
        }
    ).catch(
        (err) => {
            res.status(500);
            res.send(err.toString());
        }
    );
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
