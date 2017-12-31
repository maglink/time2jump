'use strict';

module.exports = function(grunt) {
	
	require('load-grunt-tasks')(grunt);

    grunt.initConfig({

		browserify: {
			dist: {
				files: {
                    'www/scripts.min.js': 'app/scripts/**/*.js'
				}
			}
		},

		uglify: {
			dist: {
				src: 'build/_browserify.js',
				dest: 'www/scripts.min.js'
			}
		},

		sass: {
			dist: {
				options: {
				    style: 'compressed'
				},
				files: {
				    'www/styles.css': 'app/styles/*.scss'
				}
			}
		},

		copy: {
			htmls: {
				expand: true,
				cwd: 'app',
				src: '**/*.html',
				dest: 'www/'
			},
            files: {
                expand: true,
                cwd: 'app/files',
                src: '**/*',
                dest: 'www/files'
            }
		},

		watch: {
			options: { livereload: true },
			scripts: {
				files: ['app/scripts/**/*.js'],
				tasks: ['browserify'],
				options: {
				    spawn: false
				}
			},
			styles: {
				files: ['app/styles/*.scss'],
				tasks: ['sass'],
				options: {
					spawn: false
				}
			},
			html: {
				files: ['app/**/*.html'],
				tasks: ['copy:htmls'],
				options: {
					spawn: false
				}
			},
            files: {
                files: ['app/files/**/*'],
                tasks: ['copy:files'],
                options: {
                    spawn: false
                }
            }
		},

		connect: {
			server: {
				options: {
					livereload: true,
					port: 9000,
					base: 'www',
                    open: {
                        target: 'http://localhost:9000'
                    }
				}
			}
		}

    });

    grunt.registerTask('default', [
		'browserify',
        //'uglify',
		'sass',
		'copy'
	]);

    grunt.registerTask('server', [
		'default',
		'connect',
		'watch'
	]);

};
