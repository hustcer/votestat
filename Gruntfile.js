/**
 * Grunt file for front end js check and minify.
 * Date      : 2013/02/20
 * copyright : (c) 2013 by QiZhi Tech.
 */
module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            options: {
                asi       : true,
                curly     : false,
                eqeqeq    : true,
                immed     : false,
                latedef   : true,
                newcap    : true,
                noarg     : true,
                sub       : true,
                undef     : true,
                boss      : true,
                eqnull    : true,
                smarttabs : true,
                browser   : true,
                jquery    : true,
                white     : false,
                laxbreak  : false,
                laxcomma  : true,
                expr      : true,
                devel     : false,
                globals   : {
                    module    : true,
                    Mousetrap : true,
                    jQuery    : true
                }
            },
            all: ['Gruntfile.js', 'js/**/*.js', '!js/**/*.min.js', '!js/json2.js', '!js/jquery.simplemodal.js']
        },
        clean: {
            release: {
                src: ['release/']
            }
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.description %>  Ver: <%= pkg.version %>  Date: <%= grunt.template.today("yyyy/mm/dd HH:MM:ss") %> */\n'
            },
            dist: {
                // Grunt will search for "**/?.js" under "js/" when the "uglify" task
                // runs and build the appropriate src-dest file mappings then, so you
                // don't need to update the Gruntfile when files are added or removed.
                files: [
                    {
                        expand : true,                                  // Enable dynamic expansion.
                        cwd    : 'js/',                                 // Src matches are relative to this path.
                        src    : ['jquery.simplemodal.js','index.js'],  // Actual pattern(s) to match.
                        dest   : 'release/js/'                          // Destination path prefix.
                        // ext : '.js'                                  // Dest filepaths will have this extension. '.min.js' is recommeded.
                    }
                ]
            }
        },
        cssmin: {
          minify: {
            expand : true,
            cwd    : 'style/',
            src    : ['*.css'],
            dest   : 'release/style/',
            ext    : '.css'
          }
        },
        htmlmin: {                                       // Task
            dist: {                                      // Target
              options: {                                 // Target options
                removeComments: true,
                collapseWhitespace: true
              },
              files: {                                   // Dictionary of files
                'release/index.html': 'index.html'       // 'destination': 'source'
              }
            }
        },
        copy: {
          main: {
            files: [
              {expand: true, cwd: '.', src: ['js/*.min.js', 'js/json2.js', 'images/*'], dest: 'release/'}
            ]
          }
        },
        // make a zipfile
        compress: {
          main: {
            options: {
              archive: 'release/voteStatistic.zip'
            },
            files: [
              // {src: ['release/**'], dest: 'release/'},                           // includes files in path and its subdirs
              {expand: true, cwd: 'release/', src: ['**'], dest: 'voteStatistic/'}  // makes all src relative to cwd
            ]
          }
        }

    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-htmlmin');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-compress');

    grunt.registerTask('min'    , ['clean', 'uglify', 'cssmin', 'htmlmin', 'copy', 'compress']);
    grunt.registerTask('check'  , ['jshint']);
    grunt.registerTask('default', ['jshint', 'clean', 'uglify', 'cssmin', 'htmlmin', 'copy', 'compress']);

};

