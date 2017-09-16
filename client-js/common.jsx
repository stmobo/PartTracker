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

export function getUserInfo() {
    var userInfoJSON = sessionStorage.getItem('userobject');
    if(userInfoJSON === null) {
        // fetch user info from API
        return fetch('/api/user', {credentials: 'include'}).then(
            (res) => {
                if(!res.ok) return Promise.reject(res);

                return Promise.all([
                    res.text(),
                    res.json()
                ]);
            }
        ).then(
            (retns) => {
                // save the info in session storage
                sessionStorage.setItem('userobject', retns[0]);
                return retns[1];
            }
        ).catch(errorHandler);
    } else {
        return Promise.resolve(JSON.parse(userInfoJSON));
    }
}

export var localeString = 'en-US';
export var timezone = 'America/Chicago';
