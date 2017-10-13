import React from 'react';
import {store} from '../common/store.js';

import SortableCollection from '../common/SortableCollection.jsx';
import ListHeaderColumn from '../common/ListHeaderColumn.jsx';

import RequestCreator from './RequestCreator.jsx';
import Request from './Request.jsx';

function RequestListHeader({ setSortKey, sortState }) {
    return (
        <div className="list-header row">
            <ListHeaderColumn setSortKey={setSortKey} sortState={sortState} className="col-md-4" sortKey='item'>
                Item
            </ListHeaderColumn>
            <ListHeaderColumn setSortKey={setSortKey} sortState={sortState} className="col-md-1" sortKey='count'>
                Count
            </ListHeaderColumn>
            <ListHeaderColumn setSortKey={setSortKey} sortState={sortState} className="col-md-1" sortKey='status'>
                Status
            </ListHeaderColumn>
            <ListHeaderColumn setSortKey={setSortKey} sortState={sortState} className="col-md-3" sortKey='requester'>
                Requester
            </ListHeaderColumn>
            <ListHeaderColumn setSortKey={setSortKey} sortState={sortState} className="col-md-3" sortKey='eta'>
                ETA
            </ListHeaderColumn>
        </div>
    );
}

function RequestComparer(sortKey, a, b) {
    var nA = a[sortKey];
    var nB = b[sortKey];

    switch(sortKey) {
        case 'item':
            nA = store.getState().inventory.get(nA).name.toLowerCase();
            nB = store.getState().inventory.get(nB).name.toLowerCase();
            break;
        case 'requester':
            nA = store.getState().users.get(nA).realname.toLowerCase();
            nB = store.getState().users.get(nB).realname.toLowerCase();
            break;
        case 'count':
            nA = parseInt(nA, 10);
            nB = parseInt(nB, 10);
            break;
        case 'status':
            nA = nA.toLowerCase();
            nB = nB.toLowerCase();
            break;
        case 'eta':
            nA = (new Date(nA)).getTime();
            nB = (new Date(nB)).getTime();
            break;
    }

    if(nA < nB) return -1;
    if(nA === nB) return 0;
    return 1;
}

export default SortableCollection('requests', Request, RequestCreator, RequestListHeader, RequestComparer);
