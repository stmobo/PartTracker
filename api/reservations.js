var express = require('express');
var monk = require('monk');
var bodyParser = require('body-parser');

var dbAPI = require('api/db.js');
var common = require('api/routing.js');

var Item = require('api/Item.js');
var Reservation = require('api/Reservation.js');

var router = express.Router();
router.use(bodyParser.json());


/* Get info on all part reservations. */
router.get('/reservations', (req, res) => {
    dbAPI.reservations.find({}, {}).then(
        (docs) => {
            promises = docs.map(
                (doc) => {
                    rsvp = new Reservation(doc._id);
                    return rsvp.summary();
                }
            );

            return Promise.all(promises);
        }
    ).then(common.jsonSuccess(res)).catch(common.apiErrorHandler(req, res));
});

/* Add new reservation.
   Parameters:
    - "part": part ID to reserve.
    - "count": number of parts to reserve.
    - "requester": name of team / person to reserve the parts under.
 */
router.post('/reservations', (req, res) => {
    common.checkRequestParameters(req, 'part', 'count', 'requester').then(
        () => {
            var item = new Item(monk.id(req.body.part));
            return item.available();
        }
    ).then(
        (avail_parts) => {
            requested_parts = parseInt(req.body.count);
            if(requested_parts > avail_parts)
                return Promise.reject("Not enough parts available to satisfy new reservation.");

            var rsvp = new Reservation();
            rsvp.requester(req.body.requester);
            rsvp.count(requested_parts);
            rsvp.part(req.body.part);

            return rsvp.save();
        }
    ).then(common.sendJSON(res, 201)).catch(common.apiErrorHandler(req, res));
});

router.get("/reservations/:rid", (req, res) => {
    rsvp = new Reservation(monk.id(req.params.rid));

    rsvp.exists().then(
        (exists) => {
            if(!exists)
                return Promise.reject("Reservation not found in database.");
            return rsvp.summary();
        }
    ).then(common.jsonSuccess(res)).catch(common.apiErrorHandler(req, res));
});

router.put("/reservations/:rid", (req, res) => {
    rsvp = new Reservation(monk.id(req.params.rid));

    common.checkRequestParameters(req, 'part', 'count', 'requester').then(
        () => {
            return rsvp.part();
        }
    ).then(
        (part) => {
            if(part.id().toString() !== req.body.part) {
                return part.available();
            } else {
                return Promise.all([
                    part.available(),   // total available parts
                    rsvp.count()        // parts from this RSVP pre-update
                ]).then( (retn) => { return retn[0]+retn[1]; } );
            }
        }
    ).then(
        (avail_parts) => {
            requested_parts = parseInt(req.body.count);
            if(requested_parts > avail_parts)
                return Promise.reject("Not enough parts available to satisfy new reservation.");

            rsvp.part(monk.id(req.body.part));
            rsvp.count(requested_parts);
            rsvp.requester(req.body.requester);

            return rsvp.save();
        }
    ).then(common.jsonSuccess(res)).catch(common.apiErrorHandler(req, res));
});

router.delete("/reservations/:rid", (req, res) => {
    rsvp = new Reservation(monk.id(req.params.rid));

    rsvp.delete().then(common.emptySuccess(res)).catch(common.apiErrorHandler(req, res));
});

module.exports = router;
