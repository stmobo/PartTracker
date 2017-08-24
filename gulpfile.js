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
