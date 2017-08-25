<<<<<<< HEAD
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
=======
var gulp = require('gulp');
var browserify = require('browserify');
var minify = require('gulp-minify');
var source = require('vinyl-source-stream');

function jsx_babelify(file) {
    return function() {
        return browserify('client-js/'+file+'.jsx', { transform: 'babelify', debug: true })
            .bundle()
            .pipe(source(file+'.js'))
            .pipe(minify({
                ext: {
                    source: '-debug.js',
                    min: '.js'
                }
            }))
            .pipe(gulp.dest('static/js'));
    }
}

gulp.task('login', jsx_babelify('login'));
gulp.task('users', jsx_babelify('users'));
gulp.task('inventory', jsx_babelify('inventory'));
// TODO: Add common nav task, overall JS build task, etc.
>>>>>>> 7b10ce497f8acfb0e5b0f6a6c98f97680e1963b8
