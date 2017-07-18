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
                return Promise.all([res.ok, res.text()]);
            }
        ).then(
            (retns) => {
                if(retns[0]) {
                    // login successful
                    sessionStorage.setItem('userobject', retns[1]);
                    window.location.href = '/inventory.html';
                } else {
                    // login failed
                    var info = JSON.parse(retns[1]);
                    this.setState({ flashMessage: info[0].message });
                }
            }
        ).catch(errorHandler);
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

ReactDOM.render(
    <Login />,
    document.getElementById('root')
);
