import React from 'react';
import { connect } from 'react-redux';
import { store } from "./common/store.js";

function mapStateToProps(state) {
    return {
        users: Array.from(state.users.values())
    }
}

/* Renders a dropdown list for selecting users.
 * Required props:
 * props.onChange(userID) - callback for getting the selected user ID.
 * props.initial - Initial user ID to select.
 */
class UserSelectDropdown extends React.Component {
    constructor({ users, initial, onChange }) {
        super({ users, initial, onChange });

        this.state = { selected: initialSelectedUser };

        this.onSelectChanged = this.onSelectChanged.bind(this);
    }

    onSelectChanged(ev) {
        ev.preventDefault();
        this.setState({ selected: ev.target.value });
        this.props.onChange(ev.target.value);
    }

    render() {
        var elems = this.props.users.map(
            (userObject) => (<option value={userObject.id} key={userObject.id}>{userObject.username}</option>);
        );

        return (<select onChange={this.onSelectChanged} value={this.state.selected}>{elems}</select>);
    }
}

export default UserDropdownList = connect(mapStateToProps)(UserSelectDropdown);
