import React from 'react';

import SortableCollection from '../common/SortableCollection.jsx';
import ListHeaderColumn from '../common/ListHeaderColumn.jsx';

import Item from "./Item.jsx";
import ItemCreateForm from "./ItemCreateForm.jsx";

function ItemListHeader({ setSortKey, sortState }) {
    return (
        <tr className="">
            <ListHeaderColumn setSortKey={setSortKey} sortState={sortState} sortKey="name">
                Item Name
            </ListHeaderColumn>
            <th>
                Status
            </th>
            <ListHeaderColumn setSortKey={setSortKey} sortState={sortState} sortKey="available">
                Available
            </ListHeaderColumn>
            <ListHeaderColumn setSortKey={setSortKey} sortState={sortState} sortKey="requested">
                Requested
            </ListHeaderColumn>
            <ListHeaderColumn setSortKey={setSortKey} sortState={sortState} sortKey="reserved">
                Reserved
            </ListHeaderColumn>
            <ListHeaderColumn setSortKey={setSortKey} sortState={sortState} sortKey="count">
                Total
            </ListHeaderColumn>
        </tr>
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
