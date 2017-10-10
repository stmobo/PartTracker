import React from 'react';
import ReactDOM from 'react-dom';
import {connect} from 'react-redux';

import actions from './common/actions.js';

function NotificationPortal({ children }) {
    return ReactDOM.createPortal(
        children,
        document.getElementById('notification')
    )
}

function mapStateToProps(state, ownProps) {
    return {
        priority: state.notification.priority,
        message: state.notification.message,
    }
}

function mapDispatchToProps(dispatch, ownProps) {
    return {
        clearNotification: (ev) => {
            ev.stopPropagation();
            dispatch(actions.setNotification());
        }
    }
}

function NotificationHandler({ priority, message, clearNotification }) {
    if(message === undefined || message === '') {
        return null;
    } else {
        var priority_class = '';
        if(priority === 'success') {
            priority_class = 'bg-success';
        } else if(priority === 'error') {
            priority_class = 'bg-danger';
        }
        return (
            <NotificationPortal>
                <p className={'notification-text '+priority_class}>
                    {message}
                    <button onClick={clearNotification} type="button" className="close" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                </p>
            </NotificationPortal>
        )
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(NotificationHandler);
