import React from 'react';
import ReactDOM from 'react-dom';
import {errorHandler, jsonOnSuccess, renderUpdateTime} from './common.jsx';

class Login extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            username: '',
            password: '',
            flashMessage: '',
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
        this.setState({ username: '', password: '', flashMessage: ''});
    }

    handleFormSubmit(ev) {
        ev.preventDefault();
        fetch('/api/login', {
            method: 'POST',
            credentials: 'include',
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                username: this.state.username,
                password: this.state.password,
            }),
            redirect: 'follow'
        }).then(
            (res) => {
                if(res.ok) { window.location.href = '/inventory.html'; }
                return res.json();
            }
        ).then(
            (info) => { this.setState({ flashMessage: info.message }); }
        ).catch(errorHandler);
    }

    render() {
        return (
            <form className="login-form" autoComplete="off" onSubmit={this.handleFormSubmit} onReset={this.handleFormReset}>
                <div>{this.state.flashMessage}</div>
                <button className="btn btn-danger btn-sm" type="reset">Clear</button>
                <label>Username: <input type="text" name="username" value={this.state.username} onChange={this.handleFormChange} /></label>
                <label>Password: <input type="password" name="password" value={this.state.password} onChange={this.handleFormChange} /></label>
                <button type="submit" className="btn btn-success btn-sm">Log In</button>
            </form>
        );
    }

}

ReactDOM.render(
    <Login />,
    document.getElementById('root')
);
