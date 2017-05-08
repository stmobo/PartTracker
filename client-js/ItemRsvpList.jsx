import React from 'react';
import ReactDOM from 'react-dom';
import {errorHandler, jsonOnSuccess, renderUpdateTime} from './common.jsx';

/*
 * Renders a single Reservation item in an ItemRsvpList.
 *
 * Props required:
 *  - model [Reservation object]: the Reservation object to render
 *  - onRSVPDeleted [callback]: called when the Delete button is clicked
 *      should have signature onRSVPDeleted(rsvp_id).
 */
class RsvpListElement extends React.Component {
    constructor(props) {
        super(props);

        this.handleRSVPDelete = this.handleRSVPDelete.bind(this);
    }

    handleRSVPDelete(ev) {
        ev.stopPropagation();
        this.props.onRSVPDeleted(this.props.model.id);
    }

    render() {
        const updateTime = new Date(this.props.model.updated);
        return (
            <li className="inv-rsvp-item">
                {this.props.model.count} reserved by <strong>{this.props.model.requester}</strong>
                {renderUpdateTime(updateTime)}
                <span onClick={this.handleRSVPDelete} className="glyphicon glyphicon-remove offset-button"></span>
            </li>
        );
    }
}

/*
 * Renders a list of Reservation items, as well as a form for creating new Reservations.
 *
 * Props required:
 *  - partID [string]: Part ID to list Reservations for.
 *  - availableCount [number]: number of items that can be reserved. If 0 the button to access the form will be disabled.
 *  - onListUpdated [callback]: called whenever the Reservation list for this item is updated
 */
export default class ItemRsvpList extends React.Component {
    constructor(props) {
        super(props);
        this.state = { reservations: [], formShown: false, requester: '', count: 0 };

        this.handleFormToggle = this.handleFormToggle.bind(this);
        this.handleFormChange = this.handleFormChange.bind(this);
        this.handleFormReset = this.handleFormReset.bind(this);

        this.handleRSVPSubmit = this.handleRSVPSubmit.bind(this);
        this.handleRSVPDeleted = this.handleRSVPDeleted.bind(this);

        this.fetchList = this.fetchList.bind(this);

        this.fetchList();
    }

    fetchList() {
        fetch('/api/inventory/'+this.props.partID+'/reservations').then(
            jsonOnSuccess
        ).then(
            (rsvps) => { this.setState({ reservations: rsvps }); }
        ).catch(errorHandler);
    }

    handleRSVPSubmit(ev) {
        ev.preventDefault();

        var newRSVP = {part: this.props.partID, count: parseInt(this.state.count), requester: this.state.requester};

        /* POST the response to the API: */
        fetch('/api/reservations', {
                method: 'POST',
                body: JSON.stringify(newRSVP),
                headers: {"Content-Type": "application/json"}
            })
        .then(this.fetchList)
        .then(this.props.onListUpdated)
        .catch(errorHandler);
    }

    handleRSVPDeleted(rid) {
        /* Send the DELETE request to the API: */
        fetch('/api/reservations/'+rid,{method: 'DELETE'})
        .then(this.fetchList)
        .then(this.props.onListUpdated)
        .catch(errorHandler);
    }



    handleFormToggle(ev) {
        this.setState({ formShown: !this.state.formShown });
        ev.stopPropagation();
    }

    handleFormChange(ev) {
        this.setState({
            [ev.target.name]: ev.target.value
        });
    }

    handleFormReset(ev) {
        ev.preventDefault();
        this.setState({count: 0, requester:'', formShown:false});
    }



    render() {
        const rsvpElems = this.state.reservations.map(
            (rsvp) => {
                return <RsvpListElement key={rsvp.id} onRSVPDeleted={this.handleRSVPDeleted} model={rsvp} />
            }
        );
        var form = null;
        var canAddNewRSVP = (this.props.availableCount > 0);

        if(this.state.formShown && canAddNewRSVP) {
            form = (
                <form className="new-rsvp-form" autoComplete="off" onClick={(ev) => {ev.stopPropagation();}} onSubmit={this.handleRSVPSubmit} onReset={this.handleFormReset}>
                    <button className="btn btn-danger btn-sm" type="reset">Cancel</button>
                    <div>
                        <label>Requester: <input type="text" name="requester" value={this.state.requester} onChange={this.handleFormChange} /></label>
                        <label>Count:<input type="number" name="count" value={this.state.count} onChange={this.handleFormChange} min="0" max={this.props.availableCount} /></label>
                    </div>
                    <button type="submit" className="btn btn-success btn-sm">Add reservation</button>
                </form>
            );
        } else {
            var btnClasses = "btn btn-default btn-sm ";
            if(!canAddNewRSVP)
                btnClasses += "disabled";

            form = (
                <button
                className={btnClasses}
                onClick={ canAddNewRSVP ? this.handleFormToggle : (ev) => {ev.stopPropagation()} }>
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
