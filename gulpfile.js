/**
 * Created by wangj on 2016/9/29.
 */

var gulp = require('gulp');
var fs = require('fs');
var replace = require('gulp-replace');
var uglify = require('gulp-uglify');
var minifycss = require('gulp-minify-css');
var rename = require('gulp-rename');

gulp.task('include', function() {
    var htmlDir = './module/';
    var destDir = './html/';
    fs.readdir(destDir, function(err, files) {
        if(err) {
            console.log(err);
        } else {
            files.forEach((function(f) {
                gulp.src(destDir + f)
                    .pipe(replace(/<!--header-->[\s\S]*<!--headerend-->/, '<!--header-->\n' + fs.readFileSync(htmlDir
                        + '_header.html', 'utf-8') + '\n<!--headerend-->'))
                    .pipe(gulp.dest(destDir))
                    .pipe(replace(/<!--script-select_on-->[\s\S]*<!--script-select_onend-->/, '<!--script-select_on-->\n'
                        + fs.readFileSync(htmlDir + '_select_on.html', 'utf-8') + '\n<!--script-select_onend-->'))
                    .pipe(gulp.dest(destDir))
                    .pipe(replace(/<!--editor-->[\s\S]*<!--editorend-->/, '<!--editor-->\n'
                        + fs.readFileSync(htmlDir + '_editor.html', 'utf-8') + '\n<!--editorend-->'))
                    .pipe(gulp.dest(destDir))
            }));
        }
    });
});

gulp.task('minifycss', function() {
    var sourceDir = './_css/';
    var destDir = './css/';
    fs.readdir(sourceDir, function(err, files) {
        if(err) {
            console.log(err);
        } else {
            files.forEach((function(f) {
                gulp.src(sourceDir + f)
                    .pipe(rename({suffix: '.min'}))
                    .pipe(minifycss())
                    .pipe(gulp.dest(destDir))
            }));
        }
    });
});

gulp.task('minifyjs', function() {
    var sourceDir = './_js/';
    var destDir = './js/';
    fs.readdir(sourceDir, function(err, files) {
        if(err) {
            console.log(err);
        } else {
            files.forEach((function(f) {
                gulp.src(sourceDir + f)
                    .pipe(uglify())
                    .pipe(rename({suffix: '.min'}))
                    .pipe(gulp.dest(destDir))
            }));
        }
    });
});

gulp.task('watch', function() {gulp.watch(['./module/*', './html/*'], ['include']);});
gulp.task('minifycss', function() {gulp.watch(['./_css/*'], ['minifycss']);});
gulp.task('minifyjs', function() {gulp.watch(['./_js/*'], [ 'minifyjs']);});