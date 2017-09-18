import React from 'react';
import ReactDOM from 'react-dom';

export function errorHandler(err) {
    if(err instanceof Response) {
        console.error("Request to "+err.url+" returned error "+err.status.toString()+' '+err.statusText);
        console.error(err.body);
    } else if(err instanceof Error) {
        console.error(err.stack);
    } else {
        console.error(err.toString());
    }
}

export function jsonOnSuccess(res) {
    if(!res.ok)
        return Promise.reject(res);

    return res.json();
}

export function renderUpdateTime(updated) {
    var elapsed = Date.now() - updated;
    var timeStr = updated.toLocaleTimeString(localeString, {timeZone: timezone});

    if(elapsed >= (24*3600*1000)) { // ms in a day
        /* Render date portion only, with update time on hover */
        (<small className="list-timestamp">
            <abbr title={timeStr}>
               (last updated { updated.toLocaleDateString(localeString, {timeZone: timezone}) })
           </abbr>
       </small>);
    } else {
        /* Render update time only */
        return (<small className="list-timestamp">
            (last updated today, {timeStr})
        </small>);
    }
}

/* Converts a Javascript Date object to a string in the format of HTML datetime-local input values */
export function dateToInputValue(dt) {
    var nFmt = new Intl.NumberFormat(undefined, { minimumIntegerDigits: 2 });
    var date = `${dt.getFullYear()}-${nFmt.format(dt.getMonth()+1)}-${nFmt.format(dt.getDate())}`;
    var time = `T${nFmt.format(dt.getHours())}:${nFmt.format(dt.getMinutes())}`;

    return date+time;
}

export function apiGetRequest(endpoint) {
    return fetch('/api'+endpoint, { credentials: 'include' }).then(jsonOnSuccess);
}

export function apiPostRequest(endpoint, payloadObject) {
    return fetch('/api'+endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(payloadObject),
    }).then(jsonOnSuccess);
}

export function apiPutRequest(endpoint, payloadObject) {
    return fetch('/api'+endpoint, {
        method: 'PUT',
        credentials: 'include',
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(payloadObject),
    }).then(jsonOnSuccess);
}

export function apiDeleteRequest(endpoint) {
    return fetch('/api'+endpoint, {
        method: 'DELETE',
        credentials: 'include'
    }).then((res) => { if(!res.ok) return Promise.reject(res); });
}

export function getUserInfo() {
    return apiGetRequest('/user');
}

export function getUserInfoByID(userID) {
    return apiGetRequest('/users').then((userList) => {
        return userList.find((userDoc) => userDoc.id === userID);
    });
}

/* Renders a dropdown list for selecting users.
 * Required props:
 * props.onChange(userID) - callback for getting the selected user ID.
 * props.initial - Initial user ID to select.
 */
export class UserSelectDropdown extends React.Component {
    constructor(props) {
        super(props);
        this.state = { users: [], selected: props.initial };

        this.onSelectChanged = this.onSelectChanged.bind(this);
        this.populateUsers = this.populateUsers.bind(this);

        this.populateUsers();
    }

    populateUsers() {
        apiGetRequest('/users').then(
            (usersList) => { this.setState({ users: usersList }); }
        ).catch(errorHandler);
    }

    onSelectChanged(ev) {
        ev.preventDefault();
        this.setState({ selected: ev.target.value });
        this.props.onChange(ev.target.value);
    }

    render() {
        var elems = this.state.users.map((userObject) => {
            return (
                <option value={userObject.id} key={userObject.id}>{userObject.username}</option>
            );
        });

        return (<select onChange={this.onSelectChanged} value={this.state.selected}>{elems}</select>);
    }
}

export var localeString = 'en-US';
export var timezone = 'America/Chicago';
