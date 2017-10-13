import React from 'react';
import {connect} from 'react-redux';
import api from '../common/api.js';
import ActivityEditor from './ActivityEditor.jsx';

function mapStateToProps(state, ownProps) {
    if(state.current_user.id === undefined) {
        return { editable: false };
    } else {
        return {
            editable: state.current_user.activityCreator
        };
    }
}

function mapDispatchToProps(dispatch, ownProps) {
    return {
        onCreate: (newModel) => {
            dispatch(api.create('activities', newModel));
        }
    }
}

class ActivityCreator extends React.Component {
    constructor(props) {
        super(props);

        this.state = { visible: false }
        this.show = (function(ev) { ev.stopPropagation(); this.setState({visible: true}) }).bind(this);
        this.hide = (function(ev) { ev.stopPropagation(); this.setState({visible: false}) }).bind(this);
    }

    render() {
        var { onCreate, editable } = this.props;
        if(!editable) {
            return null;
        }

        if(this.state.editingNewActivity) {
            return (<ActivityEditor onSubmit={onCreate} onClose={this.hide} />);
        } else {
            return (
                <div className="list-header row">
                    <div className="col-md-5">
                        <button className="btn btn-primary btn-default list-create-new-button" onClick={this.show}>Submit New Activity</button>
                    </div>
                </div>
            );
        }
    }
}

ActivityCreator = connect(mapStateToProps, mapDispatchToProps)(ActivityCreator);
export default ActivityCreator;
