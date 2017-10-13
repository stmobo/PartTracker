import React from 'react';
import {connect} from 'react-redux';
import api from '../common/api.js';
import CheckInList from './checkin/CheckInList.jsx';

function mapStateToProps(state, ownProps) {
    var checkin = ownProps.model.userHours.find(x => x.user === state.current_user.id);

    return {
        editable: state.current_user.activityCreator,
        canCheckIn: checkin !== undefined
    };
}

function mapDispatchToProps(dispatch, ownProps) {
    return {
        onDelete: () => {
            dispatch(api.delete('activities', ownProps.model))
        },
        onCheckIn: () => {
            dispatch(api.checkIn(ownProps.model));
        }
    }
}

class ActivityInfo extends React.Component {
    constructor(props) {
        super(props);

        var { model, canCheckIn, editable, onDelete, onEdit, onCheckIn } = props;

        this.state = { expanded: false }

        this.toggleExpanded = (function() { this.setState({expanded: !this.state.expanded}) }).bind(this);
        this.handleDelete = (function(ev){ ev.stopPropagation(); onDelete() }).bind(this);
        this.handleEdit = (function(ev){ ev.stopPropagation(); onEdit() }).bind(this);
        this.handleCheckin = (function(ev){ ev.stopPropagation(); onCheckIn() }).bind(this);
    }

    render() {
        var created = new Date(this.props.model.created);
        var updated = new Date(this.props.model.updated);

        var descBox = (
            <tr key='desc-box'>
                <td colSpan='42'>
                    <div>{this.props.model.description}</div>
                    <div>
                        {this.props.editable && <button onClick={this.handleDelete} className="btn btn-danger btn-xs list-button">Delete</button>}
                        {this.props.editable && <button onClick={this.handleEdit} className="btn btn-default btn-xs list-button">Edit</button>}
                        {this.props.canCheckIn && <button onClick={this.handleCheckin} className="btn btn-default btn-xs list-button">Check In</button>}
                    </div>
                    <CheckInList activity={this.props.model} />
                    <div><small>Created: {created.toLocaleString()}</small></div>
                    <div><small>Updated: {updated.toLocaleString()}</small></div>
                </td>
            </tr>
        );

        var startTime = new Date(this.props.model.startTime);
        var endTime = new Date(this.props.model.endTime);

        var mainRow = (
            <tr key='main-row' className="list-row" onClick={this.toggleExpanded}>
                <td>
                    {!this.state.expanded && <span className="glyphicon glyphicon-menu-down text-left"></span>}
                    {this.state.expanded && <span className="glyphicon glyphicon-menu-up text-left"></span>}
                    {this.props.model.title}
                </td>
                <td>
                    {this.props.model.userHours.length}
                </td>
                <td>
                    {this.props.model.maxHours}
                </td>
                <td>
                    {startTime.toLocaleDateString()}, {startTime.toLocaleTimeString()}
                </td>
                <td>
                    {endTime.toLocaleDateString()}, {endTime.toLocaleTimeString()}
                </td>
            </tr>
        )

        if(this.state.expanded) {
            return [
                mainRow,
                descBox
            ]
        } else {
            return [ mainRow ];
        }
    }
}

ActivityInfo = connect(mapStateToProps, mapDispatchToProps)(ActivityInfo);
export default ActivityInfo;
