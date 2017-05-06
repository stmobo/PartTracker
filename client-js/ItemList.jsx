import React from 'react';
import ReactDOM from 'react-dom';

function errorHandler(err) {
    if(err instanceof Response) {
        console.error("Request to "+err.url+" returned error "+err.status.toString()+' '+err.statusText);
        console.error(err.body);
    } else if(err instanceof Error) {
        console.error(err.stack);
    } else {
        console.error(err.toString());
    }
}

function jsonOnSuccess(res) {
    if(!res.ok)
        return Promise.reject(res);

    return res.json();
}

class RsvpListElement extends React.Component {
    constructor(props) {
        super(props);

        this.handleRSVPDelete = this.handleRSVPDelete.bind(this);
    }

    handleRSVPDelete(ev) {
        ev.stopPropagation();
        this.props.onRSVPDeleted(this.props.id);
    }

    render() {
        return (
            <li className="inv-rsvp-item">
                {this.props.count} reserved by <strong>{this.props.requester}</strong>
                <span onClick={this.handleRSVPDelete} className="glyphicon glyphicon-remove rsvp-remove-button"></span>
            </li>
        );
    }
}

class RsvpList extends React.Component {
    constructor(props) {
        super(props);
        this.state = { formShown: false, requester: '', count: 0 };

        this.handleRSVPToggle = this.handleRSVPToggle.bind(this);
        this.handleRSVPChange = this.handleRSVPChange.bind(this);
        this.handleRSVPSubmit = this.handleRSVPSubmit.bind(this);
        this.handleRSVPReset = this.handleRSVPReset.bind(this);
    }

    handleRSVPToggle(ev) {
        this.setState({ formShown: !this.state.formShown });
        ev.stopPropagation();
    }

    handleRSVPChange(ev) {
        this.setState({
            [ev.target.name]: ev.target.value
        });
    }

    handleRSVPSubmit(ev) {
        ev.preventDefault();
        this.props.onRSVPAdded(this.state.requester, this.state.count);
    }

    handleRSVPReset(ev) {
        ev.preventDefault();
        this.setState({count: 0, requester:''});
    }

    render() {
        const rsvpElems = this.props.rsvps.map(
            (rsvp) => {
                return <RsvpListElement key={rsvp.id} id={rsvp.id} onRSVPDeleted={this.props.onRSVPDeleted} count={rsvp.count} requester={rsvp.requester} />
            }
        );
        var form = null;

        if(this.state.formShown && this.props.canAddNewRSVP) {
            form = (
                <div>
                    <button className="btn btn-default btn-sm" onClick={this.handleRSVPToggle}>Hide</button>
                    <form className="new-rsvp-form" onClick={(ev) => {ev.stopPropagation();}} onSubmit={this.handleRSVPSubmit} onReset={this.handleRSVPReset}>
                        <div>
                            <label>Requester: <input type="text" name="requester" value={this.state.requester} onChange={this.handleRSVPChange} /></label>
                            <label>Count:<input type="number" name="count" value={this.state.count} onChange={this.handleRSVPChange} /></label>
                        </div>
                        <div>
                            <button type="submit" className="btn btn-success btn-sm">Add reservation</button>
                            <button type="reset" className="btn btn-danger btn-sm">Cancel</button>
                        </div>
                    </form>
                </div>
            );
        } else {
            var btnClasses = "btn btn-default btn-sm ";
            if(!this.props.canAddNewRSVP)
                btnClasses += "disabled";

            form = (
                <button
                className={btnClasses}
                onClick={ this.props.canAddNewRSVP ? this.handleRSVPToggle : (ev) => {ev.stopPropagation()} }>
                    Add new reservation
                 </button>
            );
        }

        return (
            <div className="inv-rsvp-list row">
                <div className="col-md-12">
                    {rsvpElems.length > 0 && <ul>{rsvpElems}</ul>}
                    {form}
                </div>
            </div>
        );
    }
}

class ItemListElement extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            name: '',
            count: 0,
            available: 0,
            reserved: 0,
            reservations: [],
            showRSVPList: false,
        };

        this.handleRSVPAdded = this.handleRSVPAdded.bind(this);
        this.handleRSVPDeleted = this.handleRSVPDeleted.bind(this);
        this.fetchItemData = this.fetchItemData.bind(this);
        this.handleClick = this.handleClick.bind(this);

        this.fetchItemData();
    }

    fetchItemData() {
        fetch('/api/inventory/'+this.props.id).then(jsonOnSuccess).then(
            (item) => {
                this.setState({
                    name: item.name,
                    count: item.count,
                    available: item.available,
                    reserved: item.reserved
                });

                return fetch('/api/inventory/'+this.props.id+'/reservations');
            }
        ).then(jsonOnSuccess).then(
            (rsvps) => { this.setState({ reservations: rsvps }); }
        ).catch(errorHandler);
    }

    handleRSVPDeleted(rid) {
        /* Send the DELETE request to the API: */
        fetch('/api/reservations/'+rid,
            {method: 'DELETE'}).then(this.fetchItemData).catch(errorHandler);
    }

    handleRSVPAdded(requester, count) {
        var newRSVP = {part: this.props.id, count: parseInt(count), requester: requester};

        console.log(JSON.stringify(newRSVP));

        /* POST the response to the API: */
        fetch('/api/reservations', {
            method: 'POST',
            body: JSON.stringify(newRSVP),
            headers: {"Content-Type": "application/json"}
        }).then(this.fetchItemData).catch(errorHandler);
    }

    handleClick(ev) {
        this.setState({
            showRSVPList: !this.state.showRSVPList
        });
    }

    render() {
        var tr_ctxt_class = "";
        var status = "";

        if(this.state.available == 0) {
            tr_ctxt_class = "status-unavailable";
            status = "Unvailable";
        } else {
            tr_ctxt_class = "status-available";
            status = "Available";
        }

        var rsvpList = null;
        if(this.state.showRSVPList) {
            rsvpList = <RsvpList canAddNewRSVP={this.state.available > 0} rsvps={this.state.reservations} onRSVPAdded={this.handleRSVPAdded} onRSVPDeleted={this.handleRSVPDeleted}/>;
        }

        return (
            <div onClick={this.handleClick}>
                <div className="inv-list-item row">
                    <div className="col-md-7">{this.state.name}</div>
                    <div className="col-md-2">{status}</div>
                    <div className={"col-md-1 "+tr_ctxt_class}>{this.state.available}</div>
                    <div className="col-md-1">{this.state.reserved}</div>
                    <div className="col-md-1">{this.state.count}</div>
                </div>
                {rsvpList}
            </div>
        );
    }
}

export default class ItemList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            items: []
        };

        this.retrItemList = this.retrItemList.bind(this);

        this.retrItemList();
    }

    retrItemList() {
        fetch('/api/inventory').then(jsonOnSuccess).then(
            (items) => {
                var ids = items.map((it) => { return it.id; });
                this.setState({items: ids});
            }
        ).catch(errorHandler);
    }

    render() {
        var elems = this.state.items.map(
            (itemID) => {
                return <ItemListElement id={itemID} key={itemID} />
            }
        )

        return (
            <div className="container-fluid" id="inv-table">
                <div className="inv-list-header row">
                    <div className="col-md-7"><strong>Item Name</strong></div>
                    <div className="col-md-2"><strong>Status</strong></div>
                    <div className="col-md-1"><strong>Available</strong></div>
                    <div className="col-md-1"><strong>Reserved</strong></div>
                    <div className="col-md-1"><strong>Total</strong></div>
                </div>
                {elems}
            </div>
        );
    }
}
