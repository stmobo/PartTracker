import React from 'react';
import ReactDOM from 'react-dom';
import UserHoursList from './checkin.jsx';
import {errorHandler, jsonOnSuccess, renderUpdateTime, getUserInfo, dateToInputValue} from './common.jsx';

class ActivityList extends React.Component {
    constructor(props) {
        super(props);

        this.state = { activities: [] };

        this.fetchActivityCollection = this.fetchActivityCollection.bind(this);
        this.handleDelete = this.handleDelete.bind(this);

        this.fetchActivityCollection();
    }

    async fetchActivityCollection() {
        try {
            var activitiesCollection = await fetch('/api/activities/', { credentials: 'include' }).then(jsonOnSuccess);
            this.setState({activities: activitiesCollection});
        } catch(err) {
            errorHandler(err);
        }
    }

    handleDelete(id) {
        var actList = this.state.activities;
        var removedIdx = actList.indexOf(act => act.id === id);

        actList.splice(removedIdx, 1);
        this.setState({ activities: actList });
    }

    render() {
        var elems = this.state.activities.map(
            (activity) => { return <ActivityEntry model={activity} key={activity.id} deleteItem={this.handleDelete} />; }
        );

        return (
            <div className="container-fluid">
                <div className="activity-entry list-header row">
                    <strong className="activity-entry-data col-md-5">Title</strong>
                    <strong className="activity-entry-data col-md-2"># Users Checked In</strong>
                    <strong className="activity-entry-data col-md-1">Hours</strong>
                    <strong className="activity-entry-data col-md-2">Start Time</strong>
                    <strong className="activity-entry-data col-md-2">End Time</strong>
                </div>
                {elems}
            </div>
        );
    }
}

/*
 * Renders a single Activity in an ActivityList.
 * Required:
 *  props.model             -- initial model object to use for rendering.
 *  props.deleteItem(id)    -- callback for Activity deletion. Should refresh the list of items.
 */
class ActivityEntry extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            model: props.model,
            editing: false
        };

        this.refreshActivityData = this.refreshActivityData.bind(this);
        this.updateActivity = this.updateActivity.bind(this);
        this.deleteActivity = this.deleteActivity.bind(this);
        this.cancelEditing = this.cancelEditing.bind(this);
        this.startEditing = this.startEditing.bind(this);
    }

    async refreshActivityData() {
        try {
            var activity = await fetch(
                '/api/activities/'+this.props.model.id, {credentials: 'include'}
            ).then(jsonOnSuccess);

            this.setState({ model: activity });
        } catch(err) {
            errorHandler(err);
        }
    }

    async updateActivity(newModel) {
        try {
            var updatedActivity = await fetch('/api/activities/'+this.props.model.id,
                {
                    method: 'PUT',
                    credentials: 'include',
                    body: JSON.stringify(newModel),
                    headers: {"Content-Type": "application/json"}
                }).then(jsonOnSuccess);
            this.setState({ model: updatedActivity, editing: false });
        } catch(err) {
            errorHandler(err);
        }
    }

    async deleteActivity() {
        try {
            var deleteRequest = await fetch('/api/activities/'+this.props.model.id, {method: 'DELETE', credentials: 'include'});
            if(!deleteRequest.ok) throw deleteRequest;

            this.props.deleteItem(this.props.model.id);
        } catch(err) {
            errorHandler(err);
        }
    }

    cancelEditing() {
        this.setState({ editing: false });
    }

    startEditing() {
        this.setState({ editing: true });
    }

    render() {
        if(this.state.editing) {
            return (<ActivityEditingForm model={this.state.model} onSubmit={this.updateActivity} onCancel={this.cancelEditing} />);
        } else {
            return (<ActivityEntryInfo model={this.state.model} onEdit={this.startEditing} onDelete={this.deleteActivity} />);
        }
    }
}

/* Renders the list entry (header and description box) for a single Activity in an ActivityCollection.
 * Requires:
 * props.model - Activity object data to render
 * props.onDelete() - callback for deleting the object.
 * props.onEdit() - callback for starting editing.
 */
class ActivityEntryInfo extends React.Component {
    constructor(props) {
        super(props);

        this.state = { expanded: false, editable: false };

        this.toggleExpanded = this.toggleExpanded.bind(this);
        this.handleEdit = this.handleEdit.bind(this);
        this.handleDelete = this.handleDelete.bind(this);
        this.checkEditability = this.checkEditability.bind(this);

        this.startTime = new Date(this.props.model.startTime);
        this.endTime = new Date(this.props.model.endTime);
        this.created = new Date(this.props.model.created);
        this.updated = new Date(this.props.model.updated);

        this.checkEditability();
    }

    async checkEditability() {
        var userInfo = await getUserInfo();
        this.setState({ editable: userInfo.activityCreator });
    }

    toggleExpanded(ev) {
        this.setState({ expanded: !this.state.expanded });
        ev.stopPropagation();
    }

    handleEdit(ev) {
        ev.preventDefault();
        ev.stopPropagation();
        this.props.onEdit();
    }

    handleDelete(ev) {
        ev.preventDefault();
        ev.stopPropagation();
        this.props.onDelete();
    }

    render() {
        var descBox = (
            <div className="activity-entry row">
                <div className="activity-entry-data col-md-12">
                    <div>{this.props.model.description}</div>
                    <div>
                        {this.state.editable && <button onClick={this.handleDelete} className="btn btn-danger btn-xs">Delete</button>}
                        {this.state.editable && <button onClick={this.handleEdit} className="btn btn-default btn-xs">Edit</button>}
                    </div>
                    <div><small>Created: {this.created.toLocaleString()}</small></div>
                    <div><small>Updated: {this.updated.toLocaleString()}</small></div>
                </div>
                <UserHoursList activity={this.props.model.id} onRefresh={this.refreshActivityData} />
            </div>
        );

        return (
            <div>
                <div className="activity-entry list-row row" onClick={this.toggleExpanded}>
                    <div className="activity-entry-data col-md-5">
                        {!this.state.expanded && <span className="glyphicon glyphicon-menu-down text-left"></span>}
                        {this.state.expanded && <span className="glyphicon glyphicon-menu-up text-left"></span>}
                        {this.props.model.title}
                    </div>
                    <div className="activity-entry-data col-md-2">
                        {this.props.model.userHours.length}
                    </div>
                    <div className="activity-entry-data col-md-1">
                        {this.props.model.maxHours}
                    </div>
                    <div className="activity-entry-data col-md-2">
                        {this.startTime.toLocaleDateString()}, {this.startTime.toLocaleTimeString()}
                    </div>
                    <div className="activity-entry-data col-md-2">
                        {this.endTime.toLocaleDateString()}, {this.endTime.toLocaleTimeString()}
                    </div>
                </div>
                {this.state.expanded && descBox}
            </div>
        );
    }
}


/* Renders a form for editing an Activity.
 * Requires:
 * props.model              - initial object data to fill in.
 * props.onSubmit(newData)  - callback for submitting / updating the server w/ form data
 * props.onCancel()         - callback for cancelling editing
 */
class ActivityEditingForm extends React.Component {
    constructor(props) {
        super(props);

        this.state = this.copyModel(props.model);

        this.handleFormChange = this.handleFormChange.bind(this);
        this.handleFormSubmit = this.handleFormSubmit.bind(this);
        this.handleFormReset = this.handleFormReset.bind(this);
        this.handleFormCancel = this.handleFormCancel.bind(this);
    }

    copyModel(model) {
        var copy = Object.assign({}, model);
        copy.userHours = [];

        for(let checkin of model.userHours) {
            copy.userHours.push(Object.assign({}, checkin));
        }

        // Special handling for dates:
        copy.startTime = dateToInputValue(new Date(model.startTime));
        copy.endTime = dateToInputValue(new Date(model.endTime));

        return copy;
    }

    handleFormChange(ev) {
        this.setState({
            [ev.target.name]: ev.target.value
        });
    }

    handleFormSubmit(ev) {
        ev.preventDefault();
        this.props.onSubmit(this.state);
    }

    handleFormReset(ev) {
        ev.preventDefault();
        this.setState(this.copyModel(this.props.model));
    }

    handleFormCancel(ev) {
        ev.preventDefault();
        this.props.onCancel();
    }

    render() {
        return (
            <form onSubmit={this.handleFormSubmit} onReset={this.handleFormReset}>
                <div className="activity-entry list-row row">
                    <div className="activity-entry-data col-md-5">
                        <input type="text" name="title" value={this.state.title} onChange={this.handleFormChange} />
                    </div>
                    <div className="activity-entry-data col-md-2">
                        {this.state.userHours.length}
                    </div>
                    <div className="activity-entry-data col-md-1">
                        <input type="number" name="maxHours" value={this.state.maxHours} onChange={this.handleFormChange} />
                    </div>
                    <div className="activity-entry-data col-md-2">
                        <input type="datetime-local" name="startTime" value={this.state.startTime} onChange={this.handleFormChange} />
                    </div>
                    <div className="activity-entry-data col-md-2">
                        <input type="datetime-local" name="endTime" value={this.state.endTime} onChange={this.handleFormChange} />
                    </div>
                </div>
                <div className="activity-entry row">
                    <div className="activity-entry-data col-md-12">
                        <textarea name="description" value={this.state.description} onChange={this.handleFormChange}></textarea>
                        <div>
                            <button type="submit" name="submit" className="btn btn-success btn-xs">Update</button>
                            <button type="reset"  name="reset" className="btn btn-danger btn-xs">Reset</button>
                            <button type="button" name="cancel" onClick={this.handleFormCancel} className="btn btn-danger btn-xs">Cancel</button>
                        </div>
                    </div>
                </div>
            </form>
        )
    }
}


ReactDOM.render(
    <ActivityList />,
    document.getElementById('root')
);
