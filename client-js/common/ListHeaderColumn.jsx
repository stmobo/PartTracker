import React from 'react';

export default function ListHeaderColumn({ setSortKey, sortState, sortKey, className, children }) {
    if(sortState.sortReversed) {
        var sortArrow = (<span className="glyphicon glyphicon-menu-up sort-indicator text-left"></span>);
    } else {
        var sortArrow = (<span className="glyphicon glyphicon-menu-down sort-indicator text-left"></span>);
    }

    return (
        <th className={className} onClick={setSortKey.bind(null, sortKey)}>
            {children}
            {sortState.sortKey === sortKey && sortArrow}
        </th>
    );
}
