var browserify = require('browserify');
var watchify = require('watchify');
var source = require('vinyl-source-stream');
var gulp = require('gulp');
var uglify = require('gulp-uglify');
var streamify = require('gulp-streamify');
var gutil = require('gulp-util');
var pump = require('pump');

function react_browserify(infile, outfile, outdir, debug) {
  outfile = (outfile === undefined) ? infile : outfile;
  outdir = (outdir === undefined) ? 'static/js' : outdir;
  debug = (debug === undefined) ? false : debug;

  var b = browserify('client-js/'+infile+'.jsx', {transform: 'babelify', debug:true});
  b = watchify(b);

  function bundlefn(cb) {
    pump([
        b.bundle(),
        source(outfile+'.js'),
        debug ? gutil.noop() : streamify(uglify()),
        gulp.dest(outdir)
    ], cb);
  }

  b.on('update', bundlefn);
  b.on('log', gutil.log);

  return bundlefn;
}

gulp.task('build-login', react_browserify('login', 'login', 'public/js'));
gulp.task('build-inventory', react_browserify('inventory'));
gulp.task('build-users', react_browserify('users'));
gulp.task('build-requests', react_browserify('Requests', 'requests'));
gulp.task('build-nav', react_browserify('CommonNav', 'navbar'));

gulp.task('build', ['build-login', 'build-inventory', 'build-users', 'build-nav', 'build-requests']);
