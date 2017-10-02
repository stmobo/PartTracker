import React from 'react';
import ReactDOM from 'react-dom';

export function errorHandler(err) {
    if(err instanceof Response) {
        console.error(`Request to ${err.url} returned status ${err.status.toString()} (${err.statusText}):`)
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
    if(!(updated instanceof Date)) {
        updated = new Date(updated);
    }
    
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

export var localeString = 'en-US';
export var timezone = 'America/Chicago';
