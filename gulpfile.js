const gulp         = require("gulp"),
      pug          = require("gulp-pug"),
      sass         = require("gulp-sass"),
      autoprefixer = require("gulp-autoprefixer"),
      imagemin     = require("gulp-imagemin"),
      cache        = require("gulp-cache"),
      browserify   = require("gulp-browserify"),
      connect      = require("gulp-connect"),
      del          = require("del"),
      runSequence  = require("run-sequence"),
      ngrok        = require("ngrok"),
      exec         = require('child_process').exec;
      config = {
          root:   ".",
          start:  "src",
          finish: "dist",
          port:   8080
      };

gulp.task("pug", function() {
    return gulp.src(config.root+"/"+config.start+"/pug/index.pug")
               .pipe(pug())
               .pipe(gulp.dest(config.root+"/"+config.finish));
});

gulp.task("sass", function() {
    return gulp.src(config.root+"/"+config.start+"/scss/*.scss")
               .pipe(sass()).on("error", sass.logError)
               .pipe(autoprefixer())
               .pipe(gulp.dest(config.root+"/"+config.finish+"/css"));
});

gulp.task("js", function() {
    return gulp.src(config.root+"/"+config.start+"/js/**/*.js")
               .pipe(browserify())
               .pipe(gulp.dest(config.root+"/"+config.finish+"/js"));
});

gulp.task("img", function(){
    return gulp.src(config.root+"/"+config.start+"/img/**/*.+(png|jpg|gif|svg)")
               .pipe(cache(imagemin()))
               .pipe(gulp.dest(config.root+"/"+config.finish+"/img/"));
});

gulp.task("clean", function(callback){
    console.log("Deleting folder '"+config.root+"/"+config.finish+"/"+"'...");
    return del(config.root+"/"+config.finish+"/**/*", {force: true});
});

gulp.task("build", ["clean"], function(callback) {
    console.log("Preprocessing...");
    runSequence("img", ["pug", "sass", "js"], callback);
});

gulp.task("watch", function(){
    console.log("Watching scripts in directory '"+config.root+"'...");
    gulp.watch(config.root+"/"+config.start+"/pug/**/*.pug", ["pug"]);
    gulp.watch(config.root+"/"+config.start+"/scss/**/*.scss", ["sass"]);
    gulp.watch(config.root+"/"+config.start+"/js/**/*.js", ["js"]);
    gulp.watch(config.root+"/"+config.start+"/img/**/*.+(png|jpg|gif|svg)", ["img"]);
});

gulp.task("server", function(){
    exec("node server.js", function (err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
    });
    // connect.server({
    //     name: "Deez Nuts",
    //     port: config.port,
    //     root: config.root+"/"+config.finish,
    //     livereload: true,
    // });
});

gulp.task("tunnel", function(){
    ngrok.connect(config.port, function (err, url) {
        if (err) {
            console.log(err);
            return;
        }
        console.log("Tunnel created at "+url+".");
    });
});

gulp.task("default", function(){
    console.log("Project '"+config.root+"' developer mode initialized! Press Ctrl+C to terminate.");
    runSequence("build", "server", "watch", "tunnel");
});
