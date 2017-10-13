import React from 'react';
import {connect} from 'react-redux';
import api from './api.js';
import FileUploadButton from '../common/FileUploadButton.jsx';

export default function SortableCollection(collectionName, ElementComponent, CreatorComponent, HeaderComponent, sortComparer, canImportCSV = false) {
    function mapStateToProps(state, ownProps) {
        var collection = Array.from(state[collectionName].values());
        var isAdmin = false;

        if(typeof state.current_user.id !== 'undefined') {
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
                dispatch(api.importCSV(collectionName, fileInput.files[0]));
            },
        };
    }

    class WrapperComponent extends React.Component {
        constructor(props) {
            super(props);

            this.state = {
                sortKey: '',
                sortReversed: false
            }

            this.setSortKey = (function(k) {
                this.setState({
                    sortKey: k,
                    sortReversed: (this.state.sortKey === k) ? !this.state.sortReversed : false
                });
            }).bind(this);
        }

        render() {
            var { collection, isAdmin } = this.props;

            var renderCol = collection;
            if(this.state.sortKey !== '') {
                renderCol = collection.slice();

                renderCol.sort((a,b) => sortComparer(this.state.sortKey, a, b));

                if(this.state.sortReversed) renderCol.reverse();
            }

            var elements = renderCol.map(
                x => (<ElementComponent key={x.id} model={x} />)
            );

            if(isAdmin) {
                var importExport = (
                    <div>
                        <FileUploadButton accept=".csv" className="btn btn-default btn-sm list-create-new-button" onFileSelected={this.props.importCSV}>Import from CSV</FileUploadButton>
                        <a className="btn btn-default btn-sm list-create-new-button" href={"/api/"+collectionName+".csv"}>Export to CSV</a>
                    </div>
                );
            } else {
                var importExport = null;
            }

            return (
                <div className="container-fluid">
                    <HeaderComponent setSortKey={this.setSortKey} sortState={this.state} />
                    {elements}
                    <CreatorComponent />
                    {importExport}
                </div>
            );
        }
    }

    return connect(mapStateToProps, mapDispatchToProps)(WrapperComponent);
}