const {promisify} = require('util');
const os = require('os');
const fs = require('fs');
const path = require('path');
const monk = require('monk');
const {MongodHelper} = require('mongodb-prebuilt');

const mkdtmp = promisify(fs.mkdtemp);
const rimraf = promisify(require('rimraf'));

var dbAPI = require('api/db.js');

async function spin_up() {
    var tmpdir = await mkdtmp(path.join(os.tmpdir(), 'parttracker_test_'));

    console.log(`MongoDB tmpdir: ${tmpdir}`);

    var mongodHelper = new MongodHelper([
        '--port', '27017',
        '--storageEngine', 'ephemeralForTest',
        '--dbpath', `${tmpdir}`
    ]);

    await mongodHelper.run();

    console.log(`MongoDB running with PID ${mongodHelper.mongoBin.childProcess.pid}`);

    mongodHelper.mongoBin.childProcess.on('close', (code) => {
        Promise.resolve(
            rimraf(tmpdir, { disableGlob: true }).then(
                () => { console.log(`Rimraf'd ${tmpdir} successfully.`) }
            ).catch(
                (err) => { throw err; }
            )
        );
    });

    return tmpdir;
}

module.exports = spin_up;
