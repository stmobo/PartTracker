var monk = require('monk');
var _ = require('underscore');
var ObjectID = require('mongodb').ObjectID;
var dbAPI = require('api/db.js');
var Item = require('api/models/Item.js');
var Reservation = require('api/models/Reservation.js');

/*
 * AssemblyRequirements that refer to nonexistent parts will be cleaned up by the Assembly class.
 * AssemblyRequirements that refer to nonexistent / invalid reservations are assumed to be unreserved.
 */
function AssemblyRequirement(itemID, count, reservation) {
    this.item = itemID;
    this.count = count;
    this.reservation = reservation;
}

/* Check to see if the referenced Item exists */
AssemblyRequirement.prototype.valid = function () {
    return dbAPI.inventory.count({_id: monk.id(this.item)}).then(
        (count) => {
            return (count > 0);
        }
    );
};

/* Check to see if the referenced Reservation is valid */
AssemblyRequirement.prototype.reserved = function () {
    if(!this.reservation) {
        return Promise.resolve(false);
    }

    return dbAPI.reservations.count({_id: monk.id(this.reservation)}).then(
        (count) => {
            return (count > 0);
        }
    );
};

/* Check to see if we can make a new reservation for this Requirement */
AssemblyRequirement.prototype.reservable = function () {
    if(!this.reservation) {
        return  Promise.resolve(false);
    }

    return dbAPI.reservations.count({_id: monk.id(this.reservation)}).then(
        (count) => {
            if(count > 0)
                return false;
            item = new Item(this.item);

            return item.available();
        }
    ).then(
        (count_available) => {
            return (count_available > this.count);
        }
    );
};

AssemblyRequirement.prototype.summary = function () {
    return Promise.all([
        this.reserved(),
        this.reservable(),
    ]).then(
        (retn) => {
            return {
                item: this.item,
                count: this.count,
                reservation: this.reservation,
                reserved: retn[0],
                reservable: retn[1]
            }
        }
    );
};

/******************************************************************************/

function AssemblyLink(id, parent, child) {
    if((id instanceof ObjectID) || (typeof id === 'string')) {
        dbAPI.DatabaseItem.call(this, dbAPI.assembly_links, id);
    } else {
        dbAPI.DatabaseItem.call(this, dbAPI.assembly_links);
        this._parent = parent;
        this._child = child;
    }
}

AssemblyLink.prototype = Object.create(dbAPI.DatabaseItem.prototype);
AssemblyLink.prototype.constructor = AssemblyLink;

AssemblyLink.prototype.parent = function (v) { return this.prop("parent", v); }
AssemblyLink.prototype.child = function (v) { return this.prop("child", v); }

/******************************************************************************/

var Assembly = function(id) {
    if((id instanceof ObjectID) || (typeof id === 'string')) {
        dbAPI.DatabaseItem.call(this, dbAPI.assemblies, id);
    } else {
        dbAPI.DatabaseItem.call(this, dbAPI.assemblies);
        this._requirements = [];    // Array of AssemblyRequirement objects
        this._name = "";            // Name of assembly
        this._assigned = [];        // Teams / People that are assigned to this assembly
    }
};

Assembly.prototype = Object.create(dbAPI.DatabaseItem.prototype);
Assembly.prototype.constructor = Assembly;

Assembly.prototype.delete = function () {
    /* Remove all associated reservations first */
    return dbAPI.reservations.remove({asm: this.id()}).then(
        () => {
            /* Remove all associated AssemblyLinks next */
            return dbAPI.assembly_links.remove({parent: this.id()});
        }
    ).then(
        () => {
            return dbAPI.assembly_links.remove({child: this.id()});
        }
    ).then(
        () => {
            /* Now actually remove this assembly */
            return dbAPI.assemblies.remove({_id: this.id()});
        }
    );
};

Assembly.prototype.exists = function (rejectIfNonexistent) {
    if(rejectIfNonexistent) {
        return dbAPI.assemblies.count({_id: this.id()}).then(
            (count) => {
                if(count > 0)
                    return this;
                else
                    return Promise.reject("Assembly does not exist.");
            }
        );
    } else {
        return dbAPI.assemblies.count({_id: this.id()}).then(
            (count) => { return count > 0; }
        );
    }
};

/* The usual getters/setters: */
Assembly.prototype.name = function (v) { return this.prop("name", v); };
Assembly.prototype.assigned = function (v) { return this.prop("assigned", v); };

/* v should be either undefined or a list of AssemblyRequirement-like objects. */
Assembly.prototype.requirements = function (v) {
    if(v === undefined) {
        /* Get requirements, but only return ones that are valid. */
        return this.prop("requirements").then(
            /* Convert the "raw" list of requirements into a list
             * of Promises that return either the actual object or null. */
            (raw_reqs) => {
                promises = raw_reqs.map((req) => {
                    obj = new AssemblyRequirement(req.item, item.count, item.reservation);
                    return obj.valid().then(
                        (is_valid) => {
                            if(is_valid)
                                return obj;
                            else
                                return null;
                        }
                    );
                });

                return Promise.all(promises);
            }
        ).then(
            /* Return everything that is not null. */
            (req_objs) => {
                return req_objs.filter((obj) => { return (obj !== null); });
            }
        );
    } else {
        /* Set requirements, but only ones that are valid. */

        /* Map all invalid Requirements to null, leave valid Requirements
         * intact. */
        promises = v.map((raw_req) => {
            return dbAPI.inventory.count({_id: monk.id(raw_req.item)}).then(
                (count) => {
                    if(count > 0)
                        return new AssemblyRequirement(raw_req.item, raw_req.count, raw_req.reservation);
                    else
                        return null;
                }
            );
        });

        return Promises.all(promises).then(
            /* Filter out non-nulls (then actually set the property) */
            (req_objs) => {
                return req_objs.filter((obj) => { return (obj !== null); });
            }
        ).then((filtered_reqs) => { return this.prop("requirements", filtered_reqs) });
    }
};

/* These functions only get / set IDs.
 * v should be undefined or a list of IDs to child Assembly objects. */
Assembly.prototype.children = function (v) {
    if(v === undefined) {
        return dbAPI.assembly_links.find({parent: this.id()}).then(
            (links) => {
                return links.map((l) => { return monk.id(l.child); });
            }
        );
    } else {
        new_children = v.map((child_id) => { return monk.id(child_id); });
        return dbAPI.assembly_links.find({parent: this.id()}).then(
            /* Get current list of children */
            (links) => {
                return links.map((l) => { return monk.id(l.child); });
            }
        ).then(
            (old_children) => {
                added_children = _.without(new_children, old_children);
                removed_children = _.without(old_children, new_children);

                /* Remove all links with this as a parent and have a child in removed_children */
                return dbAPI.assembly_links.remove({parent: this.id(), child: {$in: removed_children}}).then(() => { return added_children; });
            }
        ).then(
            (added_children) => {
                /* Add new links: */
                new_links = added_children.map((added_child) => { return {parent: this.id(), child: added_child} });

                return dbAPI.assembly_links.insert(new_links);
            }
        );
    }
};

/* v should be undefined or the ID of a parent assembly object. */
Assembly.prototype.parent = function (v) {
   if(v === undefined) {
       return dbAPI.assembly_links.findOne({child: this.id()}).then(
           (l) => { return l.child; }
       );
   } else {
       promise = dbAPI.assembly_links.remove({child: this.id()});
       /* Top-level assemblies have no (null) parents. */
       if(v !== null) {
           return promise.then(
               () => {
                   return dbAPI.assembly_links.insert({parent: monk.id(v), child: this.id()});
               }
           );
       } else {
           return promise;
       }
   }
};

Assembly.prototype.summary = function () {
    return this.fetch().then(
        () => {
            return Promise.all([
                this.name(),
                /* Get summaries for requirements (instead of the actual raw requirement object...) */
                this.requirements().then(
                    (reqs) => {
                        return reqs.map((req) => { return req.summary() });
                    }
                ),
                this.assigned(),
                this.parent(),
                this.children(),
                this.updated(),
                this.created(),
            ]);
        }
    ).then(
        (retn) => {
            return {
                id: this.id(),
                name: retn[0],
                requirements: retn[1],
                assigned: retn[2],
                parent: retn[3],
                children: retn[4],
                updated: retn[5],
                created: retn[6],
            };
        }
    )
};

module.exports = {
    Assembly: Assembly,
    Requirement: AssemblyRequirement,
    Link: AssemblyLink,
};
