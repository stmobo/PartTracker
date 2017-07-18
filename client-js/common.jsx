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

export function getUserInfo() {
    var userInfoJSON = sessionStorage.getItem('userobject');
    if(userInfoJSON === null) {
        // fetch user info from API
        return fetch('/api/user', {credentials: 'include'}).then(jsonOnSuccess).catch(errorHandler);
    } else {
        return Promise.resolve(JSON.parse(userInfoJSON));
    }
}

export var localeString = 'en-US';
export var timezone = 'America/Chicago';
