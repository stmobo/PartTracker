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
    ).then(
        (rsvps) => {
            res.status(200);
            res.json(rsvps);
        }
    ).catch(
        (err) => {
            res.status(500);
            res.send(err.toString());
        }
    );
});

/* Add new reservation.
   Parameters:
    - "part": part ID to reserve.
    - "count": number of parts to reserve.
    - "requester": name of team / person to reserve the parts under.
 */
router.post('/reservations', (req, res) => {
    if(!checkRequestParameter(req, res, 'part')) { return; }
    if(!checkRequestParameter(req, res, 'count')) { return; }
    if(!checkRequestParameter(req, res, 'requester')) { return; }
    requested_parts = parseInt(req.body.count);

    var item = new Item(monk.id(req.body.part));

    item.available().then(
        (avail_parts) => {
            if(requested_parts > avail_parts) {
                return Promise.reject("Not enough parts available to satisfy new reservation.");
            }

            var rsvp = new Reservation(
                undefined,
                req.body.part,
                parseInt(req.body.count),
                req.body.requester
            );

            return rsvp.save();
        }
    ).then(
        (rsvp) => { return rsvp.summary(); }
    ).then(
        (summ) => {
            res.status(200);
            res.json(summ);
        }
    ).catch(
        (err) => {
            if(err instanceof Error) {
                res.status(500);
            } else {
                res.status(400);
            }

            res.send(err.toString());
        }
    );
});

router.get("/reservations/:rid", (req, res) => {
    rsvp = new Reservation(monk.id(req.params.rid));

    rsvp.exists().then(
        (exists) => {
            if(!exists)
                return Promise.reject("Reservation not found in database.");
            return rsvp.summary();
        }
    ).then(
        (summ) => {
            res.status(200);
            res.json(summ);
        }
    ).catch(
        (err) => {
            if(err instanceof Error) {
                res.status(500);
            } else {
                res.status(400);
            }

            res.send(err.toString());
        }
    );
});

router.put("/reservations/:rid", (req, res) => {
    if(!checkRequestParameter(req, res, 'part')) { return; }
    if(!checkRequestParameter(req, res, 'count')) { return; }
    if(!checkRequestParameter(req, res, 'requester')) { return; }

    rsvp = new Reservation(monk.id(req.params.rid));
    requested_parts = parseInt(req.body.count);

    rsvp.part().then(
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
            if(requested_parts > avail_parts)
                return Promise.reject("Not enough parts available to satisfy new reservation.");

            rsvp.part(monk.id(req.body.part));
            rsvp.count(requested_parts);
            rsvp.requester(req.body.requester);

            return rsvp.save();
        }
    ).then(
        (rsvp) => { return rsvp.summary(); }
    ).then(
        (summ) => {
            res.status(200);
            res.json(summ);
        }
    ).catch(
        (err) => {
            if(err instanceof Error) {
                res.status(500);
            } else {
                res.status(400);
            }
            res.send(err.toString());
        }
    );
});

router.delete("/reservations/:rid", (req, res) => {
    rsvp = new Reservation(monk.id(req.params.rid));

    rsvp.delete().then(
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

module.exports = router;
