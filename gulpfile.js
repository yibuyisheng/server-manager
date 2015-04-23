var gulp = require('gulp');
var babel = require('gulp-babel');

gulp.task("compile", function () {
    return gulp.src("src/**/*.js")
        .pipe(babel())
        .on('error', function (error) {
            if (error) {
                console.log(error);
            }
            this.emit('end');
        })
        .pipe(gulp.dest("build"));
});

gulp.task('watch', ['compile'], function () {
    gulp.watch(['src/**', 'src/**/*.js'], ['compile']);
});