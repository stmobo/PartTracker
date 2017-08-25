var browserify = require('browserify');
var source = require('vinyl-source-stream');
var gulp = require('gulp');
var minify = require('gulp-minify');

function react_browserify(infile, outfile) {
  outfile = (outfile === undefined) ? infile : outfile;

  return function() {
    return browserify('client-js/'+infile+'.jsx', {transform: 'babelify', debug:true})
      .bundle()
      .pipe(source(outfile+'.js'))
      .pipe(minify({
        ext: {
          src: '-debug.js',
          min: '.js'
        }
      }))
      .pipe(gulp.dest('static/js'));
  }
}

gulp.task('build-login', react_browserify('login'));
gulp.task('build-inventory', react_browserify('inventory'));
gulp.task('build-users', react_browserify('users'));
gulp.task('build-nav', react_browserify('CommonNav', 'navbar'));

gulp.task('build', ['build-login', 'build-inventory', 'build-users', 'build-nav']);
