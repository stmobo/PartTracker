var express = require('express');
var monk = require('monk');
var bodyParser = require('body-parser');

var router = express.Router();

const db = monk('localhost:27017/partstracker');
const inventory = db.get('inventory');
const reservations = db.get('reservations');

router.use(bodyParser.json());
router.use(function(req, res, next) {
    req.db = db;
    next();
});

function sendInventoryItem(doc, res) {
    res.json({
        id: monk.id(doc._id),
        name: doc.name,
        count: doc.count
    });
}

/* Return a listing of all inventory items. */
router.get('/', function(req, res) {
    req.db.find({}, { name: 1, count: 1 }).then(
        (docs) => {
            retn = [];

            docs.forEach((doc) => {
                retn.push({ id: monk.id(doc._id), name: doc.name, count: doc.count });
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

/*
 Add a new inventory item.

 Send parameters as JSON:
  - 'name': name of item type
  - 'count': initial inventory count
 */
router.post('/', function(req, res) {
    req.db.count( { name: req.body.name } ).then(
        (count) => {
            if(count > 0) {
                return this.reject("item exists already");
            } else {
                /* insert new item into DB: */
                return req.db.insert(
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
            } elseif(err === "item exists already") {
                res.status(400);
                res.send(err);
            }
        }
    );
});

/* Get information on one inventory item. */
router.get('/:id', function(req, res) {
    var retn = [];
    req.db.findOne({ _id: monk.id(req.params.id) }).then(
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

/* Add to an inventory item count. */
router.post('/:partid/add', function(req, res) {
    req.db.update(
        { _id: monk.id(req.params.id) },
        { $inc: { count: req.body.count } }
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

module.exports = router;
