var gulp = require('gulp');
var concat = require('gulp-concat');
var sass = require('gulp-sass');
var cleanCSS = require('gulp-clean-css');
var stripDebug = require('gulp-strip-debug');
var uglify = require('gulp-uglify');

var paths = {
  sass: ['./assets/scss/**/*.scss'],
  js: ['./assets/js/*.js']
};

gulp.task('default', ['watch']);

gulp.task('styles', function(done) {
    
  // Concat Styles in order
  gulp.src(["./assets/scss/bootstrap.min.css", "./assets/scss/bootstrap-theme.min.css", "./assets/scss/animations.scss", "./assets/scss/fonts.scss", "./assets/scss/app.scss"])
  
  // Compile SASS
  .pipe(sass().on('error', sass.logError))
    
  // Clean up CSS
  .pipe(cleanCSS({compatibility: 'ie8'}))
    
  // Concat css into one single file
  .pipe(concat("app.min.css"))
    
  // Save
  .pipe(gulp.dest('./assets/css/')).on('end', done);
    
  console.log("   *** compiled app.min.css ***   ")
});

// Combine, minify, and clean JS files -- orders js files
gulp.task('scripts', function(done) {  
    
  // Concat scripts in order
  gulp.src(['./assets/js/jquery.js', './assets/js/fastclick.js', './assets/js/app.js'])
  
  // Remove debug statements
  //.pipe(stripDebug())
  
  // Minify
  //.pipe(uglify())
  
  // Concat into one file
  .pipe(concat("app.min.js"))
  
  // Save result
  .pipe(gulp.dest("./assets/js/min/")).on('end', done);
  
  console.log('   *** compiled app.min.js ***   ');
});

// Watch SCSS and JS
gulp.task('watch', function() {
    gulp.watch(paths.sass, ['styles']);
    gulp.watch(paths.js, ['scripts']);
});


