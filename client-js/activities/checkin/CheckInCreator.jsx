import React from 'react';
import {connect} from 'react-redux';
import CheckInEditor from './CheckInEditor.jsx';
import api from '../../common/api.js';

function mapStateToProps(state, ownProps) {
    return {};
}

function mapDispatchToProps(dispatch, ownProps) {
    return {
        onCreate: (newModel) => {
            var { activity } = ownProps;

            var userHoursClone = activity.userHours.slice();
            userHoursClone.push(newModel);

            var modelClone = Object.assign({}, activity);
            modelClone.userHours = userHoursClone;

            dispatch(api.update('activities', modelClone, activity.id));
        }
    }
}

class CheckInCreator extends React.Component {
    constructor(props) {
        super(props);
        var { activity, onCreate } = props;

        this.state = { visible: false };
        this.show = (function(ev) { ev.stopPropagation(); this.setState({visible: true}) }).bind(this);
        this.hide = (function() {this.setState({visible: false}) }).bind(this);
    }

    render() {
        if(this.state.visible) {
            return (<CheckInEditor onSubmit={this.props.onCreate} onClose={this.hide} />);
        } else {
            return (
                <li>
                    <button className="btn btn-primary btn-default btn-xs checkin-creator-btn" onClick={this.show}>Check In A User</button>
                </li>
            )
        }
    }
}

CheckInCreator = connect(mapStateToProps, mapDispatchToProps)(CheckInCreator);
export default CheckInCreator;
