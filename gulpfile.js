var browserify = require('browserify');
var source = require('vinyl-source-stream');
var gulp = require('gulp');
var uglify = require('gulp-uglify');
var streamify = require('gulp-streamify');
var noop = require('gulp-noop');
var pump = require('pump');

function react_browserify(infile, outfile, debug) {
  outfile = (outfile === undefined) ? infile : outfile;
  debug = (debug === undefined) ? false : debug;

  return function(cb) {
    pump([
        browserify('client-js/'+infile+'.jsx', {transform: 'babelify', debug:true}).bundle(),
        source(outfile+'.js'),
        debug ? noop() : streamify(uglify()),
        gulp.dest('static/js')
    ], cb);
  }
}

gulp.task('build-login', react_browserify('login'));
gulp.task('build-inventory', react_browserify('inventory'));
gulp.task('build-users', react_browserify('users'));
gulp.task('build-nav', react_browserify('CommonNav', 'navbar'));

gulp.task('build', ['build-login', 'build-inventory', 'build-users', 'build-nav']);
