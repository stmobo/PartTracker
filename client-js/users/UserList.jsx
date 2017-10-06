import React from 'react';
import { connect } from 'react-redux';
import {UpdateTime} from '../common.jsx';
import FileUploadButton from '../common/FileUploadButton.jsx';
import api from '../common/api.js';

import User from './User.jsx';
import UserCreator from './UserCreator.jsx';

function UserListHeader() {
    return (
        <div className="list-header row">
            <div className="col-md-5"><strong>User Name</strong></div>
            <div className="col-md-4"><strong>Real Name</strong></div>
            <div className="col-md-1"><strong>Is Admin</strong></div>
            <div className="col-md-1"><strong>Edits Activities</strong></div>
            <div className="col-md-1"><strong>Is Disabled</strong></div>
        </div>
    );
}

function mapStateToProps(state) {
    var collection = Array.from(state.users.values());
    var isAdmin = false;

    if(typeof state.current_user !== 'undefined') {
        isAdmin = state.current_user.admin
    }

    return {
        collection,
        isAdmin,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        importCSV: (fileInput) => {
            dispatch(api.importCSV('users', fileInput.files[0]));
        },
    };
}

function UserList({ collection, isAdmin, importCSV }) {
    var elements = collection.map(
        x => (<User key={x.id} model={x} />)
    );

    return (
        <div className="container-fluid" id="inv-table">
            <UserListHeader />
            {elements}
            {isAdmin && <UserCreator />}
            <div>
                {isAdmin && <FileUploadButton accept=".csv" className="btn btn-default btn-sm list-create-new-button" onFileSelected={importCSV}>Import from CSV</FileUploadButton>}
                <a className="btn btn-default btn-sm list-create-new-button" href="/api/users.csv">Export to CSV</a>
            </div>
        </div>
    )
}

UserList = connect(mapStateToProps, mapDispatchToProps)(UserList);
export default UserList;
