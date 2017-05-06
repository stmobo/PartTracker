import React from 'react';
import ReactDOM from 'react-dom';
import {errorHandler, jsonOnSuccess} from './common.jsx';

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

export default class ItemRsvpList extends React.Component {
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
