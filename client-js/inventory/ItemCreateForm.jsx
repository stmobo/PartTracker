import React from 'react';
import {connect} from 'react-redux';
import api from '../common/api.js';
import ItemEditor from "./ItemEditor.jsx";

function mapStateToProps(state, ownProps) {
    return {}
}

function mapDispatchToProps(dispatch, ownProps) {
    return {
        onCreate: (newModel) => {
            dispatch(api.create('inventory', newModel))
        }
    }
}

class ItemCreateForm extends React.Component {
    constructor(props) {
        super(props);

        this.state = { createFormOpen: false };

        this.openCreateForm = (function() { this.setState({ createFormOpen: true }); }).bind(this);
        this.closeCreateForm = (function() { this.setState({ createFormOpen: false }); }).bind(this);
    }

    render() {
        if(this.state.createFormOpen) {
            return (<ItemEditor onSubmit={this.props.onCreate} onCancel={this.closeCreateForm} />);
        } else {
            return (
                <tr>
                    <td colSpan='6'>
                        <button className="btn btn-primary btn-default list-create-new-button" onClick={this.openCreateForm}>
                            Submit New Item
                        </button>
                    </td>
                </tr>
            );
        }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(ItemCreateForm);
