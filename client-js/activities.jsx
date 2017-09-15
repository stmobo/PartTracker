import React from 'react';
import ReactDOM from 'react-dom';
import {errorHandler, jsonOnSuccess, renderUpdateTime} from './common.jsx';

class ActivityList extends React.Component {
    constructor(props) {
        super(props);

        this.state = { activities: [] };

        this.fetchActivityCollection = this.fetchActivityCollection.bind(this);

        this.fetchActivityCollection();
    }

    fetchActivityCollection() {
        fetch('/api/activities/', { credentials: 'include' })
        .then(jsonOnSuccess)
        .then(
            (collection) => { this.setState({ activities: collection }); }
        ).catch(errorHandler);
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
            model: props.model
        };

        this.refreshActivityData = this.refreshActivityData.bind(this);
        this.updateActivity = this.updateActivity.bind(this);
        this.deleteActivity = this.deleteActivity.bind(this);
    }

    refreshActivityData() {
        fetch('/api/activities/'+this.props.model.id,
            {credentials: 'include'}
        ).then(jsonOnSuccess).then(
            (activity) => { this.setState({ model: activity }); }
        ).catch(errorHandler);
    }

    updateActivity() {
        fetch('/api/activities/'+this.props.model.id,
            {
                method: 'PUT',
                credentials: 'include',
                body: JSON.stringify(this.state.model),
                headers: {"Content-Type": "application/json"}
            }
        ).then(jsonOnSuccess).then(
            (activity) => { this.setState({ model: activity }); }
        ).catch(errorHandler);
    }

    deleteActivity() {
        fetch('/api/activities/'+this.props.model.id,
            {method: 'DELETE', credentials: 'include'}
        ).then(this.props.deleteItem.bind(null, this.props.model.id))
        .catch(errorHandler);
    }

    render() {
        return (<ActivityEntryInfo model={this.state.model} />);
    }
}

/* Renders the list entry (header and description box) for a single Activity in an ActivityCollection.
 * Requires:
 * props.model - Activity object data to render
 * props.expanded - Set to true if tab / entry is opened
 */
class ActivityEntryInfo extends React.Component {
    constructor(props) {
        super(props);

        this.state = { expanded: false };

        this.toggleExpanded = this.toggleExpanded.bind(this);

        this.startTime = new Date(this.props.model.startTime);
        this.endTime = new Date(this.props.model.endTime);
        this.created = new Date(this.props.model.created);
        this.updated = new Date(this.props.model.updated);
    }

    toggleExpanded(ev) {
        this.setState({ expanded: !this.state.expanded });
        ev.stopPropagation();
    }

    render() {
        var descBox = (
            <div className="activity-entry row">
                <div className="activity-entry-data col-md-12">
                    <div>{this.props.model.description}</div>
                    <div><small>Created: {this.created.toLocaleString()}</small></div>
                    <div><small>Updated: {this.updated.toLocaleString()}</small></div>
                </div>
            </div>
        );

        return (
            <div>
                <div className="activity-entry list-row row" onClick={this.toggleExpanded}>
                    <div className="activity-entry-data col-md-5">
                        {this.props.editable && <span className="glyphicon glyphicon-remove text-left"></span>}
                        {this.props.editable && <span className="glyphicon glyphicon-pencil text-left"></span>}
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
 * props.model - initial object data to fill in.
 */
class ActivityEditingForm extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {

    }
}


ReactDOM.render(
    <ActivityList />,
    document.getElementById('root')
);
