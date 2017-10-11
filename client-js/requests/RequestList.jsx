import React from 'react';
import {connect} from 'react-redux';
import api from '../common/api.js';
import {store} from '../common/store.js';

import RequestCreator from './RequestCreator.jsx';
import Request from './Request.jsx';

function RequestListHeader({ setSortKey, sortState }) {
    if(sortState.sortReversed) {
        var sortArrow = (<span className="glyphicon glyphicon-menu-up text-left"></span>);
    } else {
        var sortArrow = (<span className="glyphicon glyphicon-menu-down text-left"></span>);
    }

    return (
        <div className="list-header row">
            <strong className="col-md-4" onClick={setSortKey.bind(null, 'item')}>
                {sortState.sortKey === 'item' && sortArrow}
                Item
            </strong>
            <strong className="col-md-1" onClick={setSortKey.bind(null, 'count')}>
                {sortState.sortKey === 'count' && sortArrow}
                Count
            </strong>
            <strong className="col-md-1" onClick={setSortKey.bind(null, 'status')}>
                {sortState.sortKey === 'status' && sortArrow}
                Status
            </strong>
            <strong className="col-md-3" onClick={setSortKey.bind(null, 'requester')}>
                {sortState.sortKey === 'requester' && sortArrow}
                Requester
            </strong>
            <strong className="col-md-3" onClick={setSortKey.bind(null, 'eta')}>
                {sortState.sortKey === 'eta' && sortArrow}
                ETA
            </strong>
        </div>
    );
}

function mapStateToProps(state, ownProps) {
    return {
        collection: Array.from(state.requests.values()),
    }
}

class RequestList extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            sortKey: '',
            sortReversed: false
        }

        this.setSortKey = (function(k) {
            this.setState({
                sortKey: k,
                sortReversed: (this.state.sortKey === k) ? !this.state.sortReversed : false
            });
        }).bind(this);
    }

    render() {
        var { collection } = this.props;

        var renderCol = collection;
        if(this.state.sortKey !== '') {
            renderCol = collection.slice();

            renderCol.sort((a,b) => {
                var nA = a[this.state.sortKey];
                var nB = b[this.state.sortKey];

                switch(this.state.sortKey) {
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
            });

            if(this.state.sortReversed) renderCol.reverse();
        }

        var elements = renderCol.map(
            x => (<Request key={x.id} model={x} />)
        );

        return (
            <div className="container-fluid">
                <RequestListHeader setSortKey={this.setSortKey} sortState={this.state} />
                {elements}
                <RequestCreator />
            </div>
        );
    }
}

RequestList = connect(mapStateToProps)(RequestList);
export default RequestList;
