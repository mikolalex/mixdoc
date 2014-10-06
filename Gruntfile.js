/*
 * grunt-mixdoc
 * https://github.com/mikolalex/mixdoc
 *
 * Copyright (c) 2014 mikolalex
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    jshint: {
      all: [
        'Gruntfile.js',
        'tasks/*.js',
        '<%= nodeunit.tests %>'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    },

    // Configuration to be run (and then tested).
    mixdoc: {
      default_options: {
        options: {
            styles_folder: './styles',
            dest_folder: './mixdoc',
        },
      },
    },

  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-concat');

  // By default, lint and run all tests.
  grunt.registerTask('default', ['jshint']);

};
