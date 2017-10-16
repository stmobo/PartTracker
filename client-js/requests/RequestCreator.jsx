import React from 'react';
import {connect} from 'react-redux';
import RequestEditor from './RequestEditor.jsx';
import api from '../common/api.js';

function mapStateToProps(state, ownProps) {
    return {};
}

function mapDispatchToProps(dispatch, ownProps) {
    return {
        onCreate: (newModel) => {
            dispatch(api.create('requests', newModel));
        },
    }
}

class RequestCreator extends React.Component {
    constructor(props) {
        super(props);
        this.state = { formOpen: false };

        this.openForm = (function(ev) { ev.stopPropagation(); this.setState({formOpen: true}); }).bind(this);
        this.closeForm = (function() { this.setState({formOpen: false}); }).bind(this);
    }

    render() {
        if(this.state.formOpen) {
            return (<RequestEditor onSubmit={this.props.onCreate} onClose={this.closeForm} />);
        } else {
            return (
                <tr>
                    <td colSpan='42'>
                        <button className="btn btn-primary btn-default list-create-new-button" onClick={this.openForm}>Submit New Request</button>
                    </td>
                </tr>
            );
        }
    }
}

RequestCreator = connect(mapStateToProps, mapDispatchToProps)(RequestCreator);
export default RequestCreator;
