/*
 * grunt-mixdoc
 * https://github.com/mikolalex/mixdoc
 *
 * Copyright (c) 2014 mikolalex
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks

  grunt.registerMultiTask('mixdoc', 'Plugin that creates documentation on SASS mixins', function() {
    // Merge task-specific and/or target-specific options with these defaults.
    var options = this.options({
      styles_folder: './styles',
      dest_folder: './mixdoc',
    });

    var fs = require("fs");
    var styles_folder = options.styles_folder;
    var dest_folder = options.dest_folder;


    var tokens = [];
    var files_to_compile = [];

    var parse_file = function (filename, chapter) {
        console.log('parsing', filename, 'chapter', chapter);
        var active = tokens;
        var content = fs.readFileSync(filename, {encoding: 'utf8'});
        if (content) {

            var short_comments = content.match(/(\n|\r)\/\/\>.*(\n|\r)(\s*?)\@mixin\s([^\(]*)(?:\s?)([^\{]*)/g);
            if (short_comments) {
                short_comments.forEach(function (str) {
                    var pieces = str.match(/(?:\n|\r)\/\/\>(.*?)(?:\s(.*)?)(?:\n|\r)(?:\s*?)\@mixin\s([^\(^\{]*)(?:\s?)(?:\((.*?)\))/i);
                    if (pieces !== null) {
                        var obj = {
                            descr: pieces[2] || '',
                            mixin: pieces[3],
                            args: pieces[4],
                            chapter: chapter,
                        };
                        if (pieces[1]) {// tag
                            obj.descr += '<br><' + pieces[1] + ' @' + obj.mixin + '>Lorem ipsum</' + pieces[1] + '>';
                        }
                        active.push(obj);
                    }
                })
            }
            //console.log('matches', short_comments);


            var long_comments = content.match(/(\n|\r)\/\*([^\*]*)\*\/(\n|\r|\s*?)\@mixin\s([^\(]*)(?:\s?)([^\{]*)/g);
            //console.log('long_comments', long_comments);
            if (long_comments) {
                long_comments.forEach(function (str) {
                    var pieces = str.match(/(?:\n|\r)\/\*([^\*]*)\*\/(?:\n|\r|\s*?)\@mixin\s([^\(^\{]*)(?:\s?)([^\{]*)/i);
                    //console.log('pieces are', pieces);
                    if (pieces !== null) {
                        var obj = {
                            descr: pieces[1],
                            mixin: pieces[2],
                            args: pieces[3],
                            filename: filename,
                            chapter: chapter,
                        }
                        var parts = obj.descr.split(/(?:\r|\n)\_(?=\_*)/);
                        if (parts && parts[1]) {
                            obj.descr = parts[0];
                            obj.code = parts[1].replace(/([\_]*)/, "");
                        }
                        //console.log('ob are', obj);
                        active.push(obj);
                    }
                })
            }
            //console.log('matches', short_comments);
        }
        //console.log('content is');
    }

    var files_to_parse = [];

    var list_files_and_dirs = function (path) {
        var files = fs.readdirSync(path);
        files.forEach(function (file_or_folder) {
            var new_path = path + '/' + file_or_folder;
            if (fs.lstatSync(new_path).isDirectory()) {
                list_files_and_dirs(new_path);
            } else {
                files_to_parse.push(parse_file.bind(null, new_path, path.replace(styles_folder + "/", "")));
                files_to_compile.push(new_path);
            }
        })
    }
    list_files_and_dirs(styles_folder);
    //console.log('files_to_parse are', files_to_compile);
    for (var i in files_to_parse) {
        files_to_parse[i]();
    }
    //console.log('tokens are', tokens);

    // Generating actual HTML

    var res = ['<!doctype html><link rel="stylesheet" href="styles.css"><style>.doc-mixin { border: 1px dotted grey;padding:40px;margin:40px; } </style>'];

    var scss = [];

    var prev_chapter = false;

    tokens.forEach(function (token) {
        var chapter = token.chapter;
        if (chapter != prev_chapter) {
            res.push('<h2>' + chapter + '</h2>');
            //console.log('adding header');
            prev_chapter = chapter;
        }

        var mixins_in_descr = token.descr.match(/\@([^\s^\@^\>]*)/g);
        if (mixins_in_descr) {
            mixins_in_descr.forEach(function (mix) {
                var mixin = mix.slice(1);
                scss.push('\n.' + mixin + ' { @include ' + mixin + '();}');
            })
        }
        //console.log('we found mixins', mixins_in_descr);
        token.descr = token.descr.replace(/\@([^\s^\@^\>]*)/g, 'class="$1"');

        res.push('<div class="doc-mixin">');
        res.push('<h4>' + token.mixin + '</h4>');
        res.push('<div class="doc-description">' + token.descr + '<div style="clear:both;"></div></div>');
        res.push('</div>');

    })

    if (!fs.existsSync(dest_folder)) {
        fs.mkdirSync(dest_folder);
    }

    fs.writeFileSync(dest_folder + '/docs.scss', scss.join(""), {encoding: 'utf8'});
    fs.writeFileSync(dest_folder + '/docs.html', res.join(""), {encoding: 'utf8'});


    files_to_compile.push(dest_folder + '/docs.scss');
    var concat_config = {
        basic: {
            src: files_to_compile,
            dest: dest_folder + '/styles.scss',
        },
    }
    //console.log('concat config is', concat_config);

    var destination_css_file = dest_folder + '/styles.css';
    var sass_config = {dist: {files: {}}};
    sass_config.dist.files[destination_css_file] = dest_folder + '/styles.scss';

    grunt.config('concat', concat_config);

    grunt.config('sass', sass_config);
    grunt.task.run('concat');
    grunt.task.run('sass');
  });

};
