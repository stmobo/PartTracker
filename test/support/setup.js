var path = require('path');
require('app-module-path').addPath(path.resolve());

var winston = require('winston');
winston.remove(winston.transports.Console);

const {promisify} = require('util');
const rimraf = promisify(require('rimraf'));

/* Make sure the TmpDB is spun up first before initializing dbAPI */
var spin_up_tmpdb = require('test/support/temp_db.js');
const dbAPI = require('api/db.js');

var mongo_tmpdir;

spin_up_tmpdb().then(
    (tmpdir) => {
        dbAPI.reset_database_connection('localhost:27017/parttracker');
        run();
    }
);
