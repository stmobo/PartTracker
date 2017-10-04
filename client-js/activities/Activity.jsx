import React from 'react';
import {connect} from 'react-redux';
import api from '../common/api.js';
import ActivityEditor from './ActivityEditor.jsx';
import ActivityInfo from './ActivityInfo.jsx';

function mapStateToProps(state, ownProps) {
    return {};
}

function mapDispatchToProps(dispatch, ownProps) {
    return {
        onUpdate: (newModel) => {
            dispatch(api.update('activities', newModel, ownProps.model.id));
        }
    };
}

class Activity extends React.Component {
    constructor(props) {
        super(props);
        var { model, onUpdate } = props;

        this.state = { editing: false };

        this.beginEdit = (function() { this.setState({editing: true}) }).bind(this);
        this.endEdit = (function() { this.setState({editing: false}) }).bind(this);
    }

    render() {
        if(this.state.editing) {
            return (<ActivityEditor model={this.props.model} onSubmit={this.props.onUpdate} onClose={this.endEdit} />)
        } else {
            return (<ActivityInfo model={this.props.model} onEdit={this.beginEdit} />);
        }
    }
}

Activity = connect(mapStateToProps, mapDispatchToProps)(Activity);

export default Activity;
