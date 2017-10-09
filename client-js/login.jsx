import React from 'react';
import {connect} from 'react-redux';
import api from './common/api.js';
import actions from './common/actions.js';

function mapStateToProps(state, ownProps) {
    return {};
}

function mapDispatchToProps(dispatch, ownProps) {
    return {
        handleLogin: (username, password) => {
            dispatch(api.login(ownProps.history, username, password));
        }
    }
}

class Login extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            username: '',
            password: '',
        }

        this.handleFormChange = this.handleFormChange.bind(this);
        this.handleFormReset = this.handleFormReset.bind(this);
        this.handleFormSubmit = this.handleFormSubmit.bind(this);
    }

    handleFormChange(ev) {
        this.setState({
            [ev.target.name]: ev.target.value
        });
    }

    handleFormReset(ev) {
        ev.preventDefault();
        this.setState({ username: '', password: '' });
    }

    handleFormSubmit(ev) {
        ev.preventDefault();
        this.props.handleLogin(this.state.username, this.state.password);
    }

    render() {
        return (
            <form className="login-form" autoComplete="off" onSubmit={this.handleFormSubmit} onReset={this.handleFormReset}>
                <div className="text-danger">{this.state.flashMessage}</div>
                <div><label>Username: <input type="text" name="username" value={this.state.username} onChange={this.handleFormChange} /></label></div>
                <div><label>Password: <input type="password" name="password" value={this.state.password} onChange={this.handleFormChange} /></label></div>
                <div>
                    <button className="btn btn-danger btn-sm" type="reset">Clear</button>
                    <button type="submit" className="btn btn-success btn-sm">Log In</button>
                </div>
            </form>
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Login);
