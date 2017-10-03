import React from 'react';
import {connect} from 'react-redux';
import api from '../common/api.js';

import RequestEditor from './RequestEditor.jsx';
import RequestInfo from './RequestInfo.jsx';

function mapStateToProps(state, ownProps) {
    return {};
}

function mapDispatchToProps(dispatch, ownProps) {
    return {
        onUpdate: (newModel) => {
            dispatch(api.update('requests', newModel, ownProps.model.id));
        }
    }
}

class Request extends React.Component {
    constructor(props) {
        var { model, onUpdate } = props;
        super(props);

        this.state = {
            editing: false
        }

        this.startEditing = (function() { this.setState({ editing: true }); }).bind(this);
        this.stopEditing = (function() { this.setState({ editing: false }); }).bind(this);
    }

    render() {
        if(this.state.editing) {
            return (<RequestEditor model={this.props.model} onSubmit={this.props.onUpdate} onClose={this.stopEditing} />);
        } else {
            return (<RequestInfo model={this.props.model} onEdit={this.startEditing} />);
        }
    }
}

Request = connect(mapStateToProps, mapDispatchToProps)(Request);
export default Request;
