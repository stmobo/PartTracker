import React from 'react';

import SortableCollection from '../common/SortableCollection.jsx';
import ListHeaderColumn from '../common/ListHeaderColumn.jsx';

import User from './User.jsx';
import UserCreator from './UserCreator.jsx';

function UserListHeader({ setSortKey, sortState }) {
    return (
        <tr>
            <ListHeaderColumn setSortKey={setSortKey} sortState={sortState} sortKey='username'>
                User Name
            </ListHeaderColumn>
            <ListHeaderColumn setSortKey={setSortKey} sortState={sortState} sortKey='realname'>
                Real Name
            </ListHeaderColumn>
            <ListHeaderColumn setSortKey={setSortKey} sortState={sortState} sortKey='admin'>
                Is Admin
            </ListHeaderColumn>
            <ListHeaderColumn setSortKey={setSortKey} sortState={sortState} sortKey='activityCreator'>
                Edits Activities
            </ListHeaderColumn>
            <ListHeaderColumn setSortKey={setSortKey} sortState={sortState} sortKey='disabled'>
                Is Disabled
            </ListHeaderColumn>
        </tr>
    );
}

function UserComparer(sortKey, a, b) {
    var nA = a[sortKey];
    var nB = b[sortKey];

    switch(sortKey) {
        case 'username':
        case 'realname':
            nA = nA.toLowerCase();
            nB = nB.toLowerCase();
            break;
        case 'admin':
        case 'activityCreator':
        case 'disabled':
            nA = nA.toString();
            nB = nB.toString();
            break;
    }

    if(nA < nB) return -1;
    if(nA === nB) return 0;
    return 1;
}

export default SortableCollection('users', User, UserCreator, UserListHeader, UserComparer, true);
