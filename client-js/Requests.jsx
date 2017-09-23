import React from 'react';
import ReactDOM from 'react-dom';
import {errorHandler, jsonOnSuccess, renderUpdateTime, getUserInfo} from './common.jsx';

class RequestList extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            collection: [],
            editingNewRequest: false
        }

        this.refreshCollection = this.refreshCollection.bind(this);
        this.deleteRequest = this.deleteRequest.bind(this);
        this.createRequest = this.createRequest.bind(this);
        this.displayNewRequestForm = this.displayNewRequestForm.bind(this);
        this.hideNewRequestForm = this.hideNewRequestForm.bind(this);

        this.refreshCollection();
    }

    displayNewRequestForm(ev) {
        ev.preventDefault();
        ev.stopPropagation();

        this.setState({ editingNewRequest: true });
    }

    hideNewRequestForm() { this.setState({ editingNewRequest: false }); }

    refreshCollection() {
        fetch(
            '/api/requests',
            { credentials: 'include',  headers: {"Accept": "application/json"}}
        ).then(jsonOnSuccess).then(
            (reqList) => {
                this.setState({ collection: reqList });
            }
        ).catch(errorHandler);
    }

    deleteRequest(id) {
        var deletedIndex = this.state.collection.findIndex((doc) => (doc.id === id));

        var newCollection = this.state.collection;
        newCollection.splice(deletedIndex, 1);
        this.setState({ collection: newCollection });

        fetch(
            '/api/requests/'+id,
            { method: 'DELETE', credentials: 'include' }
        ).then(
            (res) => { if(!res.ok) return Promise.reject(res); }
        ).catch(errorHandler);
    }

    createRequest(model) {
        fetch(
            '/api/requests',
            {
                method: 'POST',
                credentials: 'include',
                headers: {"Accept": "application/json", "Content-Type": "application/json"},
                body: JSON.stringify(model)
            }
        ).then(
            (res) => { if(!res.ok) return Promise.reject(res); }
        ).then(this.refreshCollection).catch(errorHandler);
    }

    render() {
        var elems = this.state.collection.map(
            (request) => (<Request key={request.id} model={request} onDelete={this.deleteRequest} />)
        );

        if(this.state.editingNewRequest) {
            var newRequestForm = (<RequestEditor onSubmit={this.createRequest} onCancel={this.hideNewRequestForm} />);
        } else {
            var newRequestForm = (
                <div className = "request-entry list-header row">
                    <div className = "request-entry-info col-md-12">
                        <button className="btn btn-primary btn-default list-create-new-button" onClick={this.displayNewRequestForm}>Submit New Request</button>
                    </div>
                </div>
            );
        }

        return (
            <div className="container-fluid">
                <div className="request-entry list-header row">
                    <strong className="request-entry-info col-md-4">Item</strong>
                    <strong className="request-entry-info col-md-1">Count</strong>
                    <strong className="request-entry-info col-md-1">Status</strong>
                    <strong className="request-entry-info col-md-3">Requester</strong>
                    <strong className="request-entry-info col-md-3">ETA</strong>
                </div>
                {elems}
                {newRequestForm}
            </div>
        );
    }
};

/*
 * Renders and tracks a Request inside of a RequestList.
 * Required props:
 * props.model - (initial) model data to pass to subcomponents.
 * props.onDelete(id) - Called when the user wishes to delete this Request.
 */
class Request extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            model: props.model,
            editing: false
        }

        this.startEditing = this.startEditing.bind(this);
        this.stopEditing = this.stopEditing.bind(this);
        this.updateRequest = this.updateRequest.bind(this);
        this.deleteRequest = this.deleteRequest.bind(this);
    }

    deleteRequest() { this.props.onDelete(this.state.model.id); }
    startEditing() { this.setState({ editing: true }); }
    stopEditing() { this.setState({ editing: false }); }

    updateRequest(newModel) {
        fetch('/api/requests/'+this.state.model.id, {
            method: 'PUT',
            credentials: 'include',
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(newModel)
        }).then(jsonOnSuccess).then(
            (model) => { this.setState({ model: model, editing: false }); }
        ).catch(errorHandler);
    }

    render() {
        if(this.state.editing) {
            return (<RequestEditor model={this.state.model} onSubmit={this.updateRequest} onCancel={this.stopEditing} />);
        } else {
            return (<RequestInfo model={this.state.model} onDelete={this.deleteRequest} onEditStart={this.startEditing} />);
        }
    }
};

/* Renders information for a Request as part of a RequestList.
 * Required props:
 * props.onEditStart - Called when the user wishes to edit this Request.
 * props.onDelete - Called when the user wishes to delete this Request.
 * props.model - Request model data to render.
 */
class RequestInfo extends React.Component {
    constructor(props) {
        super(props);

        this.state = { requesterInfo: {}, itemInfo: {} }

        fetch(
            '/api/users/'+props.model.requester,
            { credentials: 'include',  headers: {"Accept": "application/json"}}
        ).then(jsonOnSuccess).then(
            (userObject) => {
                this.setState({ requesterInfo: userObject });
            }
        ).catch(errorHandler);

        fetch(
            '/api/inventory/'+props.model.item,
            { credentials: 'include',  headers: {"Accept": "application/json"}}
        ).then(jsonOnSuccess).then(
            (itemObject) => {
                this.setState({ itemInfo: itemObject });
            }
        ).catch(errorHandler);

        this.handleDelete = this.handleDelete.bind(this);
        this.handleEdit = this.handleEdit.bind(this);
    };

    handleDelete(ev) {
        ev.stopPropagation();
        ev.preventDefault();

        this.props.onDelete();
    }

    handleEdit(ev) {
        ev.stopPropagation();
        ev.preventDefault();

        this.props.onEditStart();
    }

    render() {
        var friendlyStatus = 'Unknown';
        switch(this.props.model.status) {
            case 'waiting':
                friendlyStatus = 'Waiting';
                break;
            case 'in_progress':
                friendlyStatus = 'In Progress';
                break;
            case 'delayed':
                friendlyStatus = 'Delayed';
                break;
            case 'fulfilled':
                friendlyStatus = 'Fulfilled';
                break;
        }

        var eta = new Date(this.props.model.eta);
        var formattedETA = eta.toLocaleString();

        return (
            <div className="request-entry list-row row">
                <div className="request-entry-info col-md-4">
                    <strong>{this.state.itemInfo.name}</strong>
                    <button onClick={this.handleDelete} className="btn btn-danger btn-xs list-button">Delete</button>
                    <button onClick={this.handleEdit} className="btn btn-default btn-xs list-button">Edit</button>
                </div>
                <div className="request-entry-info col-md-1">
                    {this.props.model.count}
                </div>
                <div className="request-entry-info col-md-1">
                    {friendlyStatus}
                </div>
                <div className="request-entry-info col-md-3">
                    {this.state.requesterInfo.realname} ({this.state.requesterInfo.username})
                </div>
                <div className="request-entry-info col-md-3">
                    {formattedETA}
                </div>
            </div>
        );
    }
};

/* Renders a form for editing (possibly uncreated) Requests.
 * Required props:
 * props.onSubmit(invRQ) - Callback for submitting / updating the request.
 * props.onCancel() - Callback for cancelling editing.
 * props.model - initial model data to fill in for form (if necessary)
 */
class RequestEditor extends React.Component {
    constructor(props) {
        super(props);

        if(props.model !== undefined) {
            this.state = {
                item: this.props.model.item,
                requester: this.props.model.requester,
                status: this.props.model.status,
                count: parseInt(this.props.model.count, 10),
                eta: new Date(this.props.model.eta),

                usersList: [],
                itemsList: [],
            }
        } else {
            this.state = {
                item: '',
                requester: '',
                count: 0,
                status: 'waiting',
                eta: new Date(),

                usersList: [],
                itemsList: [],
            }
        }

        this.handleFormInputChange = this.handleFormInputChange.bind(this);
        this.handleFormReset = this.handleFormReset.bind(this);
        this.handleFormSubmit = this.handleFormSubmit.bind(this);
        this.handleFormCancel = this.handleFormCancel.bind(this);

        /* Get inventory and user lists (replace with separate components ASAP) */
        Promise.all([
            fetch('/api/users', {credentials: 'include'}).then(jsonOnSuccess),
            fetch('/api/inventory', {credentials: 'include'}).then(jsonOnSuccess),
        ]).then(
            (lists) => {
                this.setState({
                    usersList: lists[0],
                    itemsList: lists[1],
                    item: lists[1][0].id,
                    requester: lists[0][0].id,
                });
            }
        ).catch(errorHandler);
    }

    handleFormInputChange(ev) {
        ev.preventDefault();
        ev.stopPropagation();

        if(ev.target.name === 'eta') {
            this.setState({ eta: new Date(ev.target.value) });
        } else if(ev.target.name === 'count') {
            this.setState({ count: parseInt(ev.target.value, 10) });
        } else {
            this.setState({ [ev.target.name]: ev.target.value });
        }
    }

    handleFormReset(ev) {
        ev.preventDefault();
        ev.stopPropagation();

        this.setState({
            item: this.props.model.item,
            requester: this.props.model.requester,
            status: this.props.model.status,
            count: parseInt(this.props.model.count, 10),
            eta: new Date(this.props.model.eta),
        })
    }

    handleFormSubmit(ev) {
        ev.preventDefault();
        ev.stopPropagation();

        this.props.onSubmit({
            item: this.state.item,
            requester: this.state.requester,
            count: this.state.count,
            status: this.state.status,
            eta: this.state.eta,
        });
    }

    handleFormCancel(ev) {
        ev.preventDefault();
        ev.stopPropagation();

        this.props.onCancel();
    }

    render() {
        /* TODO: Add User / Item selector components. */
        var itemOptions = this.state.itemsList.map(
            (item) => (<option value={item.id} key={item.id}>{item.name}</option>)
        );

        var userOptions = this.state.usersList.map(
            (user) => (<option value={user.id} key={user.id}>{user.realname} ({user.username})</option>)
        );

        /* TODO: replace these with actual functions in Common.jsx when those are merged into master */
        var nFmt = new Intl.NumberFormat(undefined, { minimumIntegerDigits: 2 });
        var date = `${this.state.eta.getFullYear()}-${nFmt.format(this.state.eta.getMonth()+1)}-${nFmt.format(this.state.eta.getDate())}`;
        var time = `T${nFmt.format(this.state.eta.getHours())}:${nFmt.format(this.state.eta.getMinutes())}`;

        var htmlETA = date+time;

        return (
            <form className="request-entry list-row row" onReset={this.handleFormReset} onSubmit={this.handleFormSubmit}>
                <div className="request-entry-info col-md-4">
                    <select name="item" value={this.state.item} onChange={this.handleFormInputChange}>{itemOptions}</select>
                </div>
                <div className="request-entry-info col-md-1">
                    <input name="count" type="number" value={this.state.count} min="0" onChange={this.handleFormInputChange} />
                </div>
                <div className="request-entry-info col-md-1">
                    <select name="status" value={this.state.status} onChange={this.handleFormInputChange}>
                        <option value="waiting">Waiting</option>
                        <option value="in_progress">In Progress</option>
                        <option value="delayed">Delayed</option>
                        <option value="fulfilled">Fulfilled</option>
                    </select>
                </div>
                <div className="request-entry-info col-md-3">
                    <select name="requester" value={this.state.requester} onChange={this.handleFormInputChange}>{userOptions}</select>
                </div>
                <div className="request-entry-info col-md-3">
                    <input name="eta" type="datetime-local"  value={htmlETA} onChange={this.handleFormInputChange} />
                </div>
                <div className="request-entry-info col-md-4">
                    <button type="submit" name="submit" className="btn btn-success btn-xs list-button">Submit</button>
                    <button type="reset"  name="reset" className="btn btn-danger btn-xs list-button">Reset</button>
                    <button type="button" name="cancel" onClick={this.handleFormCancel} className="btn btn-danger btn-xs list-button">Cancel</button>
                </div>
            </form>
        );
    }
};


ReactDOM.render(
    <RequestList />,
    document.getElementById('root')
);
