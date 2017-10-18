import React from 'react';
import {connect} from 'react-redux';
import api from '../../common/api.js';

function mapStateToProps(state, ownProps) {
    var userModel = state.users.get(ownProps.model.user);
    if(userModel === undefined) {
        userModel = { username: '', realname: 'Invalid User' }
    }

    return {
        userModel,
        canEdit: state.current_user.activityCreator && state.online,
    }
}

function mapDispatchToProps(dispatch, ownProps) {
    return {
        onDelete: (ev) => {
            ev.stopPropagation();

            var { model, activity } = ownProps;

            // make a copy containing everything but the checkin for this user
            var userHoursClone = activity.userHours.slice().filter(
                x => x.user !== model.user
            );

            var modelClone = Object.assign({}, activity);
            modelClone.userHours = userHoursClone;

            dispatch(api.update('activities', modelClone, activity.id));
        }
    }
}

function CheckInInfo({ model, activity, onEdit, onDelete, userModel, canEdit }) {
    var checkInDate = new Date(model.checkIn);

    function handleEdit(ev) {
        ev.stopPropagation();
        onEdit();
    }

    return (
        <li className="list-row">
            <strong>{userModel.realname}</strong> checked in at {checkInDate.toLocaleString()} for {model.hours} hours.
            {canEdit && <span onClick={onDelete} className="glyphicon glyphicon-remove offset-button"></span>}
            {canEdit && <span onClick={handleEdit} className="glyphicon glyphicon-pencil offset-button"></span>}
        </li>
    );
}

CheckInInfo = connect(mapStateToProps, mapDispatchToProps)(CheckInInfo);
export default CheckInInfo;
