import React from 'react';
import {errorHandler, jsonOnSuccess, renderUpdateTime, getCurrentUserInfo, getUserInfoByID, UserSelectDropdown, dateToInputValue, apiGetRequest, apiPutRequest, apiDeleteRequest} from './common.jsx';

/* Renders a list of checked-in users for an Activity.
 * Required props:
 * props.activity - Activity ID to render for.
 * props.onRefresh() - callback for refreshing main Activity display component.
 */
export default class UserHoursList extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            checkInList: []
        };

        this.fetchCheckInData = this.fetchCheckInData.bind(this);
        this.handleDelete = this.handleDelete.bind(this);

        this.fetchCheckInData();
    }

    fetchCheckInData() {
        return apiGetRequest('/activities/'+this.props.activity+'/users').then(
            (ciList) => {
                this.setState({ checkInList: ciList });
            }
        ).catch(errorHandler);
    }

    handleDelete() {
        this.fetchCheckInData().then(this.props.onRefresh);
    }

    render() {
        var elems = this.state.checkInList.map(
            (ci) => {
                return (
                    <UserCheckIn activity={this.props.activity} key={ci.user} model={ci} onDelete={this.handleDelete} />
                );
            }
        );

        return (
            <ul className="activity-userhours-list col-md-12">
                {elems}
            </ul>
        );
    }
}

/* Handles tracking / editing everything about a user's checkin info.
 * Required props:
 * props.activity -- Actiivty ID that this checkin falls under.
 * props.model -- (initial) check-in info to display to the user.
 * props.onDelete -- Callback for removing this item from the (local) list of check-ins.
 */
class UserCheckIn extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hours: parseFloat(props.model.hours, 10),
            checkInDate: new Date(props.model.checkIn),
            userID: props.model.user,
            user: {},
            editing: false,
            canEdit: false
        };

        this.refreshUserInfo = this.refreshUserInfo.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleDelete = this.handleDelete.bind(this);
        this.handleBeginEdit = this.handleBeginEdit.bind(this);
        this.handleEndEdit = this.handleEndEdit.bind(this);

        this.refreshUserInfo();
    }

    refreshUserInfo() {
        apiGetRequest('/users/'+this.state.userID).then(
            (userInfo) => { this.setState({ user: userInfo }); }
        ).then(() => { return apiGetRequest('/user'); }).then(
            (curUserInfo) => { this.setState({ canEdit: curUserInfo.activityCreator }); }
        ).catch(errorHandler);
    }

    handleBeginEdit() {
        this.setState({ editing: true });
    }

    handleEndEdit() {
        this.setState({ editing: false });
    }

    handleSubmit(model) {
        apiPutRequest('/activities/'+this.props.activity+'/users/'+this.state.userID, model).then(
            (newModel) => {
                this.setState({
                    hours: parseFloat(newModel.hours, 10),
                    checkInDate: new Date(newModel.checkIn),
                    userID: newModel.user,
                    editing: false
                });
            }
        ).then(this.refreshUserInfo).catch(errorHandler);
    }

    handleDelete() {
        apiDeleteRequest('/activities/'+this.props.activity+'/users/'+this.state.userID)
        .then(this.props.onDelete).catch(errorHandler);
    }

    render() {
        if(this.state.editing) {
            return (<UserCheckInEditing onSubmit={this.handleSubmit} onCancel={this.handleEndEdit} date={this.state.checkInDate} user={this.state.userID} hours={this.state.hours} />)
        } else {
            return (<UserCheckInInfo onEdit={this.handleBeginEdit} onDelete={this.handleDelete} date={this.state.checkInDate} user={this.state.user} hours={this.state.hours} canEdit={this.state.canEdit} />);
        }
    }
}

/* Renders information about a user that has checked in to an Activity.
 * Required props:
 * props.date -- Date and time when the user checked in
 * props.user -- Info about the user who checked in.
 * props.hours -- Number of hours the user spent at the activity.
 * props.canEdit -- Set to true if the user can edit activities.
 *
 * props.onEdit() -- Callback for beginning editing.
 * props.onDelete() -- Callback for deleting this check in.
 */
class UserCheckInInfo extends React.Component {
    constructor(props) {
        super(props);

        this.handleDelete = this.handleDelete.bind(this);
        this.handleEdit = this.handleEdit.bind(this);
    }

    handleDelete(ev) {
        ev.preventDefault();
        ev.stopPropagation();

        this.props.onDelete();
    }

    handleEdit(ev) {
        ev.preventDefault();
        ev.stopPropagation();

        this.props.onEdit();
    }

    render() {
        return (
            <li>
                <strong>{this.props.user.realname}</strong> checked in at {this.props.date.toLocaleString()} for {this.props.hours} hours.
                {this.props.canEdit && <span onClick={this.handleDelete} className="glyphicon glyphicon-remove offset-button"></span>}
                {this.props.canEdit && <span onClick={this.handleEdit} className="glyphicon glyphicon-pencil offset-button"></span>}
            </li>
        );
    }
}

/* Handles rendering the form for editing a checkin.
 * Required props:
 * props.user - initial user ID to fill in
 * props.date - initial date value to use for checkin
 * props.hours - initial hours value to use
 *
 * props.onSubmit(model) - Callback for submitting the updated checkin.
 * props.onCancel() - Callback for cancelling editing.
 */
class UserCheckInEditing extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            user: props.user,
            date: dateToInputValue(props.date),
            hours: props.hours
        };

        this.handleFormSubmit = this.handleFormSubmit.bind(this);
        this.handleFormReset = this.handleFormReset.bind(this);
        this.handleFormCancel = this.handleFormCancel.bind(this);
        this.handleFormInputChange = this.handleFormInputChange.bind(this);
        this.handleFormUserSelect = this.handleFormUserSelect.bind(this);
    }

    handleFormSubmit(ev) {
        ev.preventDefault();

        this.props.onSubmit({
            user: this.state.user,
            checkIn: new Date(this.state.date),
            hours: this.state.hours
        });
    }

    handleFormReset(ev) {
        this.setState({
            user: props.user,
            date: dateToInputValue(props.date),
            hours: props.hours
        });
    }

    handleFormCancel(ev) {
        ev.preventDefault();
        this.props.onCancel();
    }

    handleFormInputChange(ev) {
        ev.preventDefault();

        this.setState({
            [ev.target.name]: ev.target.value
        });
    }

    handleFormUserSelect(userID) {
        this.setState({ user: userID });
    }

    render() {
        return (
            <form onSubmit={this.handleFormSubmit} onReset={this.handleFormReset}>
                <li>
                    <UserSelectDropdown initial={this.props.user} onChange={this.handleFormUserSelect} />
                    checked in at
                    <input type="datetime-local" name="date" value={this.state.date} onChange={this.handleFormInputChange} />
                    for
                    <input type="number" name="hours" value={this.state.hours} onChange={this.handleFormInputChange} />
                    hours.

                    <button type="submit" name="submit" className="btn btn-success btn-xs">Update</button>
                    <button type="reset"  name="reset" className="btn btn-danger btn-xs">Reset</button>
                    <button type="button" name="cancel" onClick={this.handleFormCancel} className="btn btn-danger btn-xs">Cancel</button>
                </li>
            </form>
        );
    }
}
