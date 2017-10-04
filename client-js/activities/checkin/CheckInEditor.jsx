import React from 'react';
import {connect} from 'react-redux';
import api from '../../common/api.js';
import CollectionSelector from '../../common/CollectionSelector.jsx';
import {dateToInputValue} from '../../common.jsx';

const defaultModel = {
    user: '',
    checkIn: dateToInputValue(new Date()),
    hours: 0
};

export default class CheckInEditor extends React.Component {
    constructor(props) {
        super(props);
        var {model, onSubmit, onClose} = props;

        if(typeof model === 'undefined') {
            this.state = defaultModel;
        } else {
            this.state = {
                user: model.user,
                checkIn: dateToInputValue(model.checkIn),
                hours: model.hours
            };
        }

        this.handleFormSubmit = this.handleFormSubmit.bind(this);
        this.handleFormReset = this.handleFormReset.bind(this);
        this.handleFormCancel = this.handleFormCancel.bind(this);
        this.handleFormInputChange = this.handleFormInputChange.bind(this);
        this.handleFormUserSelect = this.handleFormUserSelect.bind(this);
    }

    handleFormSubmit(ev) {
        ev.preventDefault();

        this.props.onSubmit({
            user: this.state.user,
            checkIn: new Date(this.state.checkIn),
            hours: this.state.hours
        });
        this.props.onClose();
    }

    handleFormReset(ev) {
        ev.preventDefault();

        if(typeof this.props.model === 'undefined') {
            this.setState(defaultModel);
        } else {
            this.setState({
                user: this.props.model.user,
                checkIn: dateToInputValue(this.props.model.checkIn),
                hours: this.props.model.hours
            });
        }
    }

    handleFormCancel(ev) {
        ev.preventDefault();
        this.props.onClose();
    }

    handleFormInputChange(ev) {
        ev.stopPropagation();

        this.setState({
            [ev.target.name]: ev.target.value
        });
    }

    handleFormUserSelect(userID) {
        this.setState({ user: userID });
    }

    render() {
        return (
            <form onSubmit={this.handleFormSubmit} onReset={this.handleFormReset}>
                <li className="checkin-editor">
                    <CollectionSelector sorted={true} collection="users" labelKey="realname" initial={this.state.user} onChange={this.handleFormUserSelect} />
                    checked in at
                    <input type="datetime-local" name="checkIn" value={this.state.checkIn} onChange={this.handleFormInputChange} />
                    for
                    <input className="checkin-hours-editor" type="number" name="hours" value={this.state.hours} onChange={this.handleFormInputChange} />
                    hours.

                    <button type="submit" name="submit" className="btn btn-success btn-xs edit-form-btn">Update</button>
                    <button type="reset"  name="reset" className="btn btn-danger btn-xs edit-form-btn">Reset</button>
                    <button type="button" name="cancel" onClick={this.handleFormCancel} className="btn btn-danger btn-xs edit-form-btn">Cancel</button>
                </li>
            </form>
        );
    }
}
