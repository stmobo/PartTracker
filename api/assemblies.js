var express = require('express');
var monk = require('monk');
var bodyParser = require('body-parser');

var dbAPI = require('api/db.js');
var common = require('api/routing_common.js');

var Item = require('api/models/Item.js');
var Reservation = require('api/models/Reservation.js');

var Assembly = require('api/models/Assembly.js').Assembly;
var Requirement = require('api/models/Assembly.js').Requirement;

var router = express.Router();
router.use(bodyParser.json());

/*
 * Verifies that all of the subassemblies, items, and reservations required by
 * an Assembly actually exist within the database.
 *
 * If any such objects do not exist, then this returns a rejection with the
 * appropriate error message.
 *
 * Otherwise (if the assembly is valid), this returns the originally passed-in
 * Assembly object.
 */
function verifyAssembly(asm) {
    return Promise.all([asm.subassemblies(), asm.requirements()]).then(
        (retn) => {
            var subassemblies = retn[0];
            var requirements = retn[1];

            /* Map each subassembly ID to a Promise that checks whether the subassembly exists */
            checks = subassemblies.map(
                (sasmID) => {
                    return dbAPI.assemblies.count({_id: sasmID}).then(
                        (n) => {
                            if(n === 0)
                                return Promise.reject("Assembly with ID " + sasmID.toString() + " does not exist.");
                        }
                    );
                }
            );

            /* Do the same with Item and Reservation IDs... */
            requirements.forEach(
                (requirement) => {
                    var itemID = monk.id(requirement.item);

                    /* Promise that checks to see if the item exists... */
                    var itemPromise = dbAPI.inventory.count({_id: itemID}).then(
                        (n) => {
                            if(n === 0)
                                return Promise.reject("Item with ID " + itemID.toString() + " does not exist.");
                        }
                    );

                    checks.push(itemPromise);

                    /* Promise that checks to see if the associated reservation exists and is valid */
                    if(requirement.reservation) {
                        var rsvpID = monk.id(requirement.reservation);

                        if(!rsvpID)
                            return Promise.reject("Invalid reservation ID: " + requirement.reservation.toString());

                        var rsvpPromise = dbAPI.reservations.findOne({_id: rsvpID}).then(
                            (rsvp) => {
                                if(rsvp === null)
                                    return Promise.reject("Reservation with ID " + rsvpID.toString() + " does not exist.");
                                if(rsvp.part.toString() !== itemID.toString())
                                    return Promise.reject("Reservation part ID does not match requirement part ID!");
                                if(rsvp.asm.toString() !== this.id().toString())
                                    return Promise.reject("Reservation assembly ID does not match this assembly ID!");
                            }
                        );

                        checks.push(rsvpPromise);
                    }
                }
            );

            /* Now actually check / wait on everything... */
            return Promise.all(checks).then( () => { return asm; } );
        }
    );
}

/*
 * ../assemblies/:asmid - GET/PUT/DELETE one assembly
 * ../assemblies/:asmid/requirements - collection of requirements for this assembly.
 * ../assemblies/:asmid/requirements/:reqid
 *   --> :reqid/item - redirects to /inventory/ namespace
 *   --> :reqid/reservation - redirects to /reservations/ namespace
 * ../assemblies/:asmid/subassemblies - collection of links to subassemblies.
 */

router.get('/assemblies', (req, res) => {
    dbAPI.assemblies.find({}, {}).then(
        (docs) => {
            promises = docs.map(
                (doc) => {
                    asm = new Assembly(doc._id);
                    return asm.summary();
                }
            );

            return Promise.all(promises);
        }
    ).then(common.jsonSuccess(res)).catch(common.apiErrorHandler(req, res));
});

router.post('/assemblies', (req, res) => {
    common.checkRequestParameters(req, 'requirements', 'subassemblies', 'name').then(
        () => {
            if(!(req.body.subassemblies instanceof Array) ||
                !(req.body.requirements instanceof Array) ||
                !(typeof req.body.name === 'string')) {
                return Promise.reject("Invalid parameter type within Assembly object.");
            }

            var asm = new Assembly();

            asm.name(req.body.name);
            asm.subassemblies(req.body.subassemblies);

            reqs = req.body.requirements.map(
                (inReq) => { return new Requirement(inReq.item, inReq.count, null); }
            );

            asm.requirements(reqs);

            return verifyAssembly(asm);
        }
    ).then(
        (asm) => { return asm.save(); }
    ).then(
        (asm) => { return asm.summary(); }
    ).then(common.sendJSON(res, 201)).catch(common.apiErrorHandler(req, res));
});

router.get('/assemblies/:asmid', (req, res) => {
    var asm = new Assembly(req.params.asmid);

    asm.exists().then(
        (exists) => {
            if(!exists)
                return Promise.reject("Assembly does not exist within database.");
            return asm.summary();
        }
    ).then(common.jsonSuccess(res)).catch(common.apiErrorHandler(req, res));
})

router.put('/assemblies/:asmid', (req, res) => {
    var asm = new Assembly(req.params.asmid);

    asm.exists().then(
        (exists) => {
            if(!exists)
                return Promise.reject("Assembly does not exist within database.");
            return common.checkRequestParameters(req, 'requirements', 'subassemblies', 'name');
        }
    ).then(
        () => {
            if(!(req.body.subassemblies instanceof Array) ||
                !(req.body.requirements instanceof Array) ||
                !(typeof req.body.name === 'string')) {
                return Promise.reject("Invalid parameter type within Assembly object.");
            }

            asm.name(req.body.name);
            asm.subassemblies(req.body.subassemblies);

            reqs = req.body.requirements.map(
                (inReq) => { return new Requirement(inReq.item, inReq.count, inReq.reservation); }
            );

            asm.requirements(reqs);

            return verifyAssembly(asm);
        }
    ).then(
        (asm) => { return asm.save(); }
    ).then(
        (asm) => { return asm.summary(); }
    ).then(common.jsonSuccess(res)).catch(common.apiErrorHandler(req, res));
});

router.delete('/assemblies/:asmid', (req, res) => {
    var asm = new Assembly(req.params.asmid);

    asm.exists().then(
        (exists) => {
            if(!exists)
                return Promise.reject("Assembly does not exist within database.");
        }
    ).then(
        () => { return asm.delete(); }
    ).then(common.emptySuccess(res)).catch(common.apiErrorHandler(req, res));
});

module.exports = router;
