var express = require('express');
var monk = require('monk');
var bodyParser = require('body-parser');

var dbAPI = require('api/db.js');
var common = require('api/routing_common.js');

var Item = require('api/models/Item.js');
var Reservation = require('api/models/Reservation.js');
var User = require('api/models/User.js');

var router = express.Router();
router.use(bodyParser.json());

/* Get info on all part reservations. */
router.get('/reservations', (req, res, next) => {
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
    ).then(common.jsonSuccess(res)).catch(next);
});

/* Add new reservation.
   Parameters:
    - "part": part ID to reserve.
    - "count": number of parts to reserve.
    - "requester": ID of user to reserve the parts under.
    - "asm" [optional]: Assembly ID to reserve the parts for.
 */
router.post('/reservations', (req, res, next) => {
    common.checkRequestParameters(req, 'part', 'count').then(
        () => { return req.user.admin(); }
    ).then(
        (isAdmin) => {
            if(isAdmin && req.body.requester) {
                return new User(monk.id(req.body.requester));
            } else if(isAdmin && req.body.username) {
                return dbAPI.users.findOne({username: req.body.username}, {}).then(
                    (doc) => { return new User(doc._id); }
                );
            } else {
                return req.user;
            }
        }
    ).then(
        (requester) => {
            var item = new Item(monk.id(req.body.part));
            return Promise.all([item.exists(), requester.exists(), item, requester]);
        }
    ).then(
        (retns) => {
            item_exists = retns[0];
            requester_exists = retns[1];
            item = retns[2];
            requester = retns[3];

            if(!item_exists) return Promise.reject(new APIClientError(404, "Requested part does not exist!"));
            if(!requester_exists) return Promise.reject(new APIClientError(404, "Requesting user does not exist!"));

            return Promise.all([item.available(), requester]);
        }
    ).then(
        (retns) => {
            avail_parts = retns[0];
            requester = retns[1];

            requested_parts = parseInt(req.body.count);
            if(requested_parts > avail_parts)
                return Promise.reject(new APIClientError("Not enough parts available to satisfy new reservation."));

            var rsvp = new Reservation();
            rsvp.requester(requester);
            rsvp.count(requested_parts);
            rsvp.part(req.body.part);

            return rsvp.save();
        }
    ).then(common.sendJSON(res, 201)).catch(next);
});

router.use('/reservations/:rid', common.asyncMiddleware(
    async (req, res, next) => {
        var rsvp = new Reservation(monk.id(req.params.rid));
        if(!(await rsvp.exists()))
            throw new common.APIClientError(404, "Reservation not found in database.");

        req.rsvp = rsvp;
        next();
    }
));

router.get("/reservations/:rid", (req, res, next) => {
    req.rsvp.summary().then(common.jsonSuccess(res)).catch(next);
});

router.put("/reservations/:rid", (req, res, next) => {
    rsvp = req.rsvp;

    common.checkRequestParameters(req, 'part', 'count').then(
        () => { return req.user.admin(); }
    ).then(
        (isAdmin) => {
            if(isAdmin && req.body.requester) {
                return new User(monk.id(req.body.requester));
            } else if(isAdmin && req.body.username) {
                return dbAPI.users.findOne({username: req.body.username}, {}).then(
                    (doc) => { return new User(doc._id); }
                );
            } else {
                return req.user;
            }
        }
    ).then(
        (requester) => {
            var item = new Item(monk.id(req.body.part));
            return Promise.all([item.exists(), requester.exists(), item, requester]);
        }
    ).then(
        (retns) => {
            item_exists = retns[0];
            requester_exists = retns[1];
            item = retns[2];
            requester = retns[3];

            if(!item_exists) return Promise.reject(new common.APIClientError(404, "Requested part does not exist!"));
            if(!requester_exists) return Promise.reject(new common.APIClientError(404, "Requesting user does not exist!"));

            var oldPart = rsvp.part().then((part) => { return part.fetch(); });
            return Promise.all([item.fetch(), oldPart, requester]);
        }
    ).then(
        (parts) => {
            var newPart = parts[0];
            var oldPart = parts[1];
            var requester = parts[2];

            var avail_parts = null;
            if(newPart.id().toString() !== oldPart.id().toString()) {
                avail_parts = newPart.available();
            } else {
                avail_parts = Promise.all([
                    oldPart.available(),   // total available parts
                    rsvp.count()           // parts from this RSVP pre-update
                ]).then( (retn) => { return retn[0]+retn[1]; } );
            }

            return Promise.all([avail_parts, requester]);
        }
    ).then(
        (retns) => {
            var avail_parts = retns[0];
            var requester = retns[1];

            requested_parts = parseInt(req.body.count);
            if(requested_parts > avail_parts)
                return Promise.reject(new common.APIClientError(400, "Not enough parts available to satisfy new reservation."));

            rsvp.part(monk.id(req.body.part));
            rsvp.count(requested_parts);
            rsvp.requester(requester);

            return rsvp.save();
        }
    ).then(common.jsonSuccess(res)).catch(next);
});

router.delete("/reservations/:rid", (req, res, next) => {
    req.rsvp.delete().then(common.emptySuccess(res)).catch(next);
});

module.exports = router;
