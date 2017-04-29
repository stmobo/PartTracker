var express = require('express');
var monk = require('monk');
var bodyParser = require('body-parser');

var router = express.Router();

const db = monk('localhost:27017/partstracker');
const inventory = db.get('inventory');
const reservations = db.get('reservations');

reservations.ensureIndex( {part: 1} );

router.use(bodyParser.json());
router.use(function(req, res, next) {
    req.inv = inventory;
    req.rsvp = reservations
    next();
});

function sendInventoryItem(doc, res) {
    res.json({
        id: monk.id(doc._id),
        name: doc.name,
        count: doc.count
    });
}

function sendReservation(doc, res) {
    res.json({
        id: monk.id(doc._id),
        part: monk.id(doc.part),
        count: doc.count,
        requester: doc.requester
    });
}

function checkRequestParameter(req, res, key) {
    if(!(key in req.body)) {
        res.status(400).send("Missing parameter: \'"+key+"\". ");
        return false;
    }
    return true;
}

function getReservedPartsCount(req, part) {
    return req.rsvp.aggregate([
        { $match: { part: part } },
        { $group: { _id: null, reserved: { $sum: "$count" } } }
    ]).then(
        (doc) => {
            //console.log("getReservedPartsCount: type: " + typeof doc + " : " + JSON.stringify(doc));
            ret = parseInt(doc[0].reserved);
            if(ret !== ret) {
                return 0;
            } else {
                return ret;
            }
        }
    );
}

function getAvailablePartsCount(req, part) {
    return Promise.all([
        req.inv.findOne({ _id: part }).then((doc) => { return doc.count; }),
        getReservedPartsCount(req, part)
    ]).then(
        (retn) => {
            return retn[0] - retn[1];
        }
    );
}

/* Method handlers: */

/* Return a listing of all inventory items. */
router.get('/', function(req, res) {
    req.inv.find({}, { name: 1, count: 1 }).then(
        (docs) => {
            promises = docs.map(
                (doc) => {
                    return getReservedPartsCount(req, doc._id).then(
                        (reserved) => {
                            return {
                                id: monk.id(doc._id),
                                name: doc.name,
                                count: doc.count,
                                reserved: reserved
                            }
                        }
                    );
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
router.post('/', function(req, res) {
    req.inv.count( { name: req.body.name } ).then(
        (count) => {
            if(count > 0) {
                return Promise.reject("item exists already");
            } else {
                /* insert new item into DB: */
                return req.inv.insert(
                    {
                        name: req.body.name,
                        count: parseInt(req.body.count)
                    }
                );
            }
        }
    ).then(
        (doc) => {
            res.status(200);
            sendInventoryItem(doc, res);
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
router.get('/:id', function(req, res) {
    var retn = [];
    req.inv.findOne({ _id: monk.id(req.params.id) }).then(
        (doc) => {
            res.status(200);
            sendInventoryItem(doc, res);
        }
    ).catch(
        (err) => {
            res.status(500);
            res.send(err.toString());
        }
    );
});

router.delete('/:id', function(req, res) {
    req.inv.remove({ _id: monk.id(req.params.id) }).then(
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

/* Add to an inventory item count. */
router.post('/:id/add', function(req, res) {
    console.log("Body: " + JSON.stringify(req.body));
    if(!checkRequestParameter(req, res, 'count')) { return; }

    req.inv.update(
        { _id: monk.id(req.params.id) },
        { $inc: { count: parseInt(req.body.count) } }
    ).then(
        (doc) => {
            res.status(200);
            sendInventoryItem(doc, res);
        }
    ).catch(
        (err) => {
            res.status(500);
            res.send(err.toString());
        }
    );
});

/* Get info on part reservations. */
router.get('/:id/reservations', (req, res) => {
    req.rsvp.find( { part: monk.id(req.params.id) }, { count:1, requester: 1 } ).then(
        (docs) => {
            retn = [];

            docs.forEach((doc) => {
                retn.push({ id: monk.id(doc._id), requester: doc.requester, count: doc.count });
            });

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

/* Add new reservation.
   Parameters:
    - "count": number of parts to reserve.
    - "requester": name of team / person to reserve the parts under.
 */
router.post('/:id/reservations', (req, res) => {
    if(!checkRequestParameter(req, res, 'count')) { return; }
    if(!checkRequestParameter(req, res, 'requester')) { return; }
    requested_parts = parseInt(req.body.count);

    getAvailablePartsCount(req, monk.id(req.params.id)).then(
        (avail_parts) => {
            if(requested_parts > avail_parts) {
                return Promise.reject("Not enough parts available");
            }

            return req.rsvp.insert({
                part: monk.id(req.params.id),
                count: parseInt(req.body.count),
                requester: req.body.requester
            });
        }
    ).then(
        (doc) => {
            res.status(200);
            sendReservation(doc, res);
        }
    ).catch(
        (err) => {
            if(err instanceof Error) {
                res.status(500);
                res.send(err.toString());
            } else {
                res.status(400);
                res.send(err);
            }
        }
    );
});

router.get("/:id/reservations/:rid", (req, res) => {
    req.rsvp.findOne({ _id: monk.id(req.params.rid) }).then(
        (doc) => {
            res.status(200);
            sendReservation(doc, res);
        }
    ).catch(
        (err) => {
            res.status(500);
            res.send(err.toString());
        }
    );
});

router.delete("/:id/reservations/:rid", (req, res) => {
    req.rsvp.remove({ _id: monk.id(req.params.rid) }).then(
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
