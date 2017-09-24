var browserify = require('browserify');
var envify = require('envify/custom');
var source = require('vinyl-source-stream');
var gulp = require('gulp');
var uglifyjs = require('uglify-es');
var uglify_composer = require('gulp-uglify/composer');
var streamify = require('gulp-streamify');
var gutil = require('gulp-util');
var pump = require('pump');

var uglify = uglify_composer(uglifyjs, console);

function react_browserify(infile, outfile, outdir, debug) {
  outfile = (outfile === undefined) ? infile : outfile;
  outdir = (outdir === undefined) ? 'static/js' : outdir;
  debug = (debug === undefined) ? !gutil.env.production : debug;

  var b = browserify('client-js/'+infile+'.jsx', {transform: 'babelify', debug:debug});

  if(!debug) {
      b.transform(envify({ NODE_ENV: 'production' }), { global: true });
      b.transform('uglifyify', { global: true });
      b.plugin('bundle-collapser');
  }

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
gulp.task('build-activities', react_browserify('activities'));
gulp.task('build-nav', react_browserify('CommonNav', 'navbar'));

gulp.task('build', ['build-login', 'build-inventory', 'build-users', 'build-nav', 'build-requests', 'build-activities']);
