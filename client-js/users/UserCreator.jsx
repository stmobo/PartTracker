import React from 'react';
import { connect } from 'react-redux';
import UserEditor from "./UserEditor.jsx";
import api from "../common/api.js";

function mapStateToProps(state) {
    return {};
}

function mapDispatchToProps(dispatch) {
    return {
        onCreate: (newModel) => {
            dispatch(api.create('users', newModel));
        },
    };
}

class UserCreator extends React.Component {
    constructor(props) {
        var { onCreate } = props;
        super(props);

        this.state = {
            editorVisible: false,
            newPassword: '',
        };

        this.showEditor = (function() { this.setState({editorVisible: true}); }).bind(this);
        this.hideEditor = (function() { this.setState({editorVisible: false}); }).bind(this);
        this.handleCreate = this.handleCreate.bind(this);
        this.handlePWFieldUpdate = this.handlePWFieldUpdate.bind(this);
    }

    handleCreate(newModel) {
        var clone = Object.assign({ password: this.state.newPassword }, newModel);
        this.props.onCreate(clone);
    }

    handlePWFieldUpdate(ev) {
        ev.preventDefault();
        ev.stopPropagation();

        if(ev.target.name === "newPassword") {
            this.setState({ newPassword: ev.target.value });
        }
    }

    render() {
        if(this.state.editorVisible) {
            return (
                <div>
                    <UserEditor showPWEditBox={false} onSubmit={this.handleCreate} onClose={this.hideEditor} />
                    <div className="row">
                        <div className="col-md-5">
                            <input type="password" name="newPassword" placeholder="Password" value={this.state.newPassword} onChange={this.handlePWFieldUpdate} />
                        </div>
                    </div>
                </div>
            );
        } else {
            return (<div className="row">
                <div className="col-md-5">
                    <button className="btn btn-primary btn-default list-create-new-button" onClick={this.showEditor}>
                        Add New User
                    </button>
                </div>
            </div>);
        }
    }
}

UserCreator = connect(mapStateToProps, mapDispatchToProps)(UserCreator);
export default UserCreator;
