import React from 'react';
import {errorHandler, jsonOnSuccess, renderUpdateTime, getUserInfo} from './common.jsx';

export class RequestList extends React.Component {

};

export class Request extends React.Component {

};

export class RequestInfo extends React.Component {
    constructor(props) {
        super(props);

        this.state = {  }
    };

    render() {
        return (
            <div className="request-entry list-row row">
                <div className="request-entry-info col-md-4">
                    <strong>{this.props.model.item}</strong>
                </div>
                <div className="request-entry-info col-md-1">
                    {this.props.model.count}
                </div>
                <div className="request-entry-info col-md-1">
                    {this.props.model.status}
                </div>
                <div className="request-entry-info col-md-3">
                    {this.props.model.requester}
                </div>
                <div className="request-entry-info col-md-3">
                    {this.props.model.eta}
                </div>
            </div>
        );
    }
};

export class RequestEditor extends React.Component {

};
