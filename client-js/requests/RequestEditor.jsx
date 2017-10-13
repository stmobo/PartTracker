import React from 'react';
import {UpdateTime, dateToInputValue} from '../common.jsx';
import CollectionSelector from '../common/CollectionSelector.jsx';

const defaultModel = {
    item: '',
    requester: '',
    count: 0,
    status: 'waiting',
    eta: new Date()
}

/* Renders a form for editing (possibly uncreated) Requests.
 * Required props:
 * props.onSubmit(invRQ) - Callback for submitting / updating the request.
 * props.onCancel() - Callback for cancelling editing.
 * props.model - initial model data to fill in for form (if necessary)
 */
export default class RequestEditor extends React.Component {
    constructor(props) {
        var { model, onSubmit, onClose } = props;
        super(props);

        if(model !== undefined) {
            this.state = {
                item: model.item,
                requester: model.requester,
                status: model.status,
                count: parseInt(model.count, 10),
                eta: new Date(model.eta),
            }
        } else {
            this.state = defaultModel;
        }

        this.handleItemChange = (function(id) { this.setState({item: id}) }).bind(this);
        this.handleUserChange = (function(id) { this.setState({requester: id}) }).bind(this);

        this.handleFormInputChange = this.handleFormInputChange.bind(this);
        this.handleFormReset = this.handleFormReset.bind(this);
        this.handleFormSubmit = this.handleFormSubmit.bind(this);
        this.handleFormCancel = this.handleFormCancel.bind(this);
    }

    handleFormInputChange(ev) {
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
        ev.stopPropagation();

        if(typeof this.props.model === 'undefined') {
            this.setState(defaultModel);
        } else {
            this.setState({
                item: this.props.model.item,
                requester: this.props.model.requester,
                status: this.props.model.status,
                count: parseInt(this.props.model.count, 10),
                eta: new Date(this.props.model.eta),
            });
        }
    }

    handleFormSubmit(ev) {
        ev.preventDefault();
        ev.stopPropagation();

        this.props.onSubmit(this.state);
        this.props.onClose();
    }

    handleFormCancel(ev) {
        ev.preventDefault();
        ev.stopPropagation();

        this.props.onClose();
    }

    render() {
        return (
            <tr className="list-row list-editor">
                <td>
                    <CollectionSelector sorted={true} collection="inventory" labelKey="name" initial={this.state.item} onChange={this.handleItemChange} />
                    <button type="button" name="submit" onClick={this.handleFormSubmit} className="btn btn-success btn-xs list-button">Submit</button>
                    <button type="button" name="reset"  onClick={this.handleFormReset}  className="btn btn-danger btn-xs list-button">Reset</button>
                    <button type="button" name="cancel" onClick={this.handleFormCancel} className="btn btn-danger btn-xs list-button">Cancel</button>
                </td>
                <td>
                    <input name="count" type="number" value={this.state.count} min="0" onChange={this.handleFormInputChange} />
                </td>
                <td>
                    <select name="status" value={this.state.status} onChange={this.handleFormInputChange}>
                        <option value="waiting">Waiting</option>
                        <option value="in_progress">In Progress</option>
                        <option value="delayed">Delayed</option>
                        <option value="fulfilled">Fulfilled</option>
                    </select>
                </td>
                <td>
                    <CollectionSelector sorted={true} collection="users" labelKey="realname" initial={this.state.requester} onChange={this.handleUserChange} />
                </td>
                <td>
                    <input name="eta" type="datetime-local"  value={dateToInputValue(this.state.eta)} onChange={this.handleFormInputChange} />
                </td>
            </tr>
        );
    }
};
