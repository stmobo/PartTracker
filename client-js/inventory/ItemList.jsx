import React from 'react';

import SortableCollection from '../common/SortableCollection.jsx';
import ListHeaderColumn from '../common/ListHeaderColumn.jsx';

import Item from "./Item.jsx";
import ItemCreateForm from "./ItemCreateForm.jsx";

function ItemListHeader({ setSortKey, sortState }) {
    return (
        <div className="list-header row">
            <ListHeaderColumn setSortKey={setSortKey} sortState={sortState} sortKey="name" className="col-md-6">
                Item Name
            </ListHeaderColumn>
            <div className="col-md-2">
                <strong>Status</strong>
            </div>
            <ListHeaderColumn setSortKey={setSortKey} sortState={sortState} sortKey="available" className="col-md-1">
                Available
            </ListHeaderColumn>
            <ListHeaderColumn setSortKey={setSortKey} sortState={sortState} sortKey="requested" className="col-md-1">
                Requested
            </ListHeaderColumn>
            <ListHeaderColumn setSortKey={setSortKey} sortState={sortState} sortKey="reserved" className="col-md-1">
                Reserved
            </ListHeaderColumn>
            <ListHeaderColumn setSortKey={setSortKey} sortState={sortState} sortKey="count" className="col-md-1">
                Total
            </ListHeaderColumn>
        </div>
    );
}

function ItemListComparer(sortKey, a, b) {
    var nA = a[sortKey];
    var nB = b[sortKey];

    if(sortKey === 'name') {
        nA = nA.toLowerCase();
        nB = nB.toLowerCase();
    } else {
        nA = parseInt(nA, 10);
        nB = parseInt(nB, 10);
    }

    if(nA < nB) return -1;
    if(nA === nB) return 0;
    return 1;
}

export default SortableCollection('inventory', Item, ItemCreateForm, ItemListHeader, ItemListComparer, true);
