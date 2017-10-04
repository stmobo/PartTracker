import React from 'react';
import {connect} from 'react-redux';
import api from '../common/api.js';
import ActivityCreator from './ActivityCreator.jsx';
import Activity from './Activity.jsx';

function ActivityListHeader() {
    return (
        <div className="list-header row">
            <strong className="col-md-5">Title</strong>
            <strong className="col-md-2"># Users Checked In</strong>
            <strong className="col-md-1">Hours</strong>
            <strong className="col-md-2">Start Time</strong>
            <strong className="col-md-2">End Time</strong>
        </div>
    );
}

function mapStateToProps(state, ownProps) {
    var collection = Array.from(state.activities.values());
    return {
        collection,
        editable: state.current_user.activityCreator,
    };
}

function mapDispatchToProps(dispatch, ownProps) {
    return {};
}

function ActivityList({ collection, editable }) {
    var elements = collection.map(
        x => (<Activity key={x.id} model={x} />)
    );

    return (
        <div className="container-fluid">
            <ActivityListHeader />
            {elements}
            {editable && <ActivityCreator />}
        </div>
    );
}

ActivityList = connect(mapStateToProps, mapDispatchToProps)(ActivityList);
export default ActivityList;
