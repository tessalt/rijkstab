var gulp = require('gulp'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    minifycss = require('gulp-minify-css'),
    plumber = require('gulp-plumber'),
    del = require('del'),
    zip = require('gulp-zip');

var onError = function(err) {
  console.log(err);
}

gulp.task('cleanother', function(cb) {
    del(['build/index.html', 'build/manifest.json'], cb)
});

gulp.task('cleancss', function(cb) {
  del(['build/styles'], cb)
});

gulp.task('cleanjs', function(cb) {
  del(['build/scripts'], cb)
});

gulp.task('copy', ['cleanother'], function() {
  gulp.src('index.html')
  .pipe(gulp.dest('./build'));
  gulp.src('manifest.json')
  .pipe(gulp.dest('./build'));
  gulp.src('./src/images/icons/**/*.*')
  .pipe(gulp.dest('./build'));
});

gulp.task('scripts', ['cleanjs'], function() {
  gulp.src([
      './vendor/moment/moment.js',
      './vendor/jquery/dist/jquery.min.js',
      './vendor/imgLiquid/js/imgLiquid-min.js',
      './vendor/angular/angular.min.js',
      './vendor/angular-resource/angular-resource.min.js',
      './src/scripts/main.js'
    ])
  .pipe(plumber({
    errorHandler: onError
  }))
  .pipe(concat('main.js'))
  .pipe(gulp.dest('./build/scripts'));
});

gulp.task('styles', ['cleancss'], function() {
  gulp.src([
      './vendor/angular/angular-csp.css',
      './src/styles/main.css'
    ])
  .pipe(concat('main.css'))
  .pipe(minifycss())
  .pipe(gulp.dest('./build/styles'));
});

gulp.task('watch', function() {
  gulp.watch('./src/scripts/**/*.js', ['scripts']);
  gulp.watch('./src/styles/**/*.css', ['styles']);
  gulp.watch(['./**/*.html', 'manifest.json'], ['copy']);
});

gulp.task('build', ['copy', 'scripts', 'styles']);

var thesrc = ['**/*'];

gulp.task('bundle', function () {
  return gulp.src(thesrc, {cwd: __dirname + "/build"})
  .pipe(zip('bundle.zip'))
  .pipe(gulp.dest('./'));
});