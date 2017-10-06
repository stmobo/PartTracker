import React from 'react';
import {connect} from 'react-redux';
import api from '../common/api.js';

import RequestCreator from './RequestCreator.jsx';
import Request from './Request.jsx';

function RequestListHeader() {
    return (
        <div className="list-header row">
            <strong className="col-md-4">Item</strong>
            <strong className="col-md-1">Count</strong>
            <strong className="col-md-1">Status</strong>
            <strong className="col-md-3">Requester</strong>
            <strong className="col-md-3">ETA</strong>
        </div>
    );
}

function mapStateToProps(state, ownProps) {
    return {
        collection: Array.from(state.requests.values()),
    }
}

function RequestList({ collection }) {
    var elements = collection.map(
        x => (<Request key={x.id} model={x} />)
    );

    return (
        <div className="container-fluid">
            <RequestListHeader />
            {elements}
            <RequestCreator />
        </div>
    );
}

RequestList = connect(mapStateToProps)(RequestList);
export default RequestList;
