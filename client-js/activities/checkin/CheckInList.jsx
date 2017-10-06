import React from 'react';
import {connect} from 'react-redux';
import CheckInCreator from './CheckInCreator.jsx';
import CheckIn from './CheckIn.jsx';
import api from '../../common/api.js';

function mapStateToProps(state, ownProps) {
    return {
        collection: state.activities.get(ownProps.activity.id).userHours,
        editable: state.current_user.activityCreator
    }
}

function mapDispatchToProps(dispatch, ownProps) {
    return {};
}

function CheckInList({ activity, collection, editable }) {
    var elements = collection.map(
        x => (<CheckIn key={x.user} model={x} activity={activity} />)
    );

    return (
        <ul className="activity-userhours-list col-md-12">
            {elements}
            {editable && <CheckInCreator activity={activity} />}
        </ul>
    )
}

CheckInList = connect(mapStateToProps, mapDispatchToProps)(CheckInList);
export default CheckInList;
