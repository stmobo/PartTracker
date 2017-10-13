import React from 'react';

import SortableCollection from '../common/SortableCollection.jsx';
import ListHeaderColumn from '../common/ListHeaderColumn.jsx';

import ActivityCreator from './ActivityCreator.jsx';
import Activity from './Activity.jsx';

function ActivityListHeader({ setSortKey, sortState }) {
    return (
        <tr>
            <ListHeaderColumn setSortKey={setSortKey} sortState={sortState} className="col-md-5" sortKey="title">
                Title
            </ListHeaderColumn>
            <ListHeaderColumn setSortKey={setSortKey} sortState={sortState} className="col-md-2" sortKey='users_checked_in'>
                # Users Checked In
            </ListHeaderColumn>
            <ListHeaderColumn setSortKey={setSortKey} sortState={sortState} className="col-md-1" sortKey='maxHours'>
                Hours
            </ListHeaderColumn>
            <ListHeaderColumn setSortKey={setSortKey} sortState={sortState} className="col-md-2" sortKey='startTime'>
                Start Time
            </ListHeaderColumn>
            <ListHeaderColumn setSortKey={setSortKey} sortState={sortState} className="col-md-2" sortKey='endTime'>
                End Time
            </ListHeaderColumn>
        </tr>
    );
}

function ActivityComparer(sortKey, a, b) {
    if(sortKey === 'users_checked_in') {
        var nA = null;
        var nB = null;
    } else {
        var nA = a[sortKey];
        var nB = b[sortKey];
    }

    switch(sortKey) {
        case 'title':
            nA = nA.toLowerCase();
            nB = nB.toLowerCase();
            break;
        case 'users_checked_in':
            nA = a.userHours.length;
            nB = b.userHours.length;
            break;
        case 'maxHours':
            nA = parseInt(a.maxHours, 10);
            nB = parseInt(b.maxHours, 10);
            break;
        case 'startTime':
        case 'endTime':
            nA = (new Date(nA)).getTime();
            nB = (new Date(nB)).getTime();
            break;
    }

    if(nA < nB) return -1;
    if(nA === nB) return 0;
    return 1;
}

export default SortableCollection('activities', Activity, ActivityCreator, ActivityListHeader, ActivityComparer);
