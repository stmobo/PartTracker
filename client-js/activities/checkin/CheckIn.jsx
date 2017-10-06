import React from 'react';
import {connect} from 'react-redux';
import CheckInEditor from './CheckInEditor.jsx';
import CheckInInfo from './CheckInInfo.jsx';
import api from '../../common/api.js';

function mapStateToProps(state, ownProps) {
    return {};
}

function mapDispatchToProps(dispatch, ownProps) {
    return {
        onUpdate: (newModel) => {
            var { model, activity } = ownProps;

            // make a copy containing everything but the checkin for this user
            var userHoursClone = activity.userHours.slice().filter(
                x => x.user !== model.user
            );
            userHoursClone.push(newModel);

            var modelClone = Object.assign({}, activity);
            modelClone.userHours = userHoursClone;

            dispatch(api.update('activities', modelClone, activity.id));
        }
    }
}

class CheckIn extends React.Component {
    constructor(props) {
        super(props);
        var {model, activity, onUpdate} = props;

        this.state = { editing: false };
        this.startEdit = (function() { this.setState({editing: true}) }).bind(this);
        this.stopEdit = (function() { this.setState({editing: false}) }).bind(this);
    }

    render() {
        if(this.state.editing) {
            return (<CheckInEditor model={this.props.model} onSubmit={this.props.onUpdate} onClose={this.stopEdit} />);
        } else {
            return (<CheckInInfo model={this.props.model} activity={this.props.activity} onEdit={this.startEdit} />);
        }
    }
}

CheckIn = connect(mapStateToProps, mapDispatchToProps)(CheckIn);
export default CheckIn;
