/*
 * grunt-mixdoc
 * https://github.com/mikolalex/mixdoc
 *
 * Copyright (c) 2014 mikolalex
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function (grunt) {

    // Please see the Grunt documentation for more information regarding task
    // creation: http://gruntjs.com/creating-tasks

    function escapeHtml(text) {
        var map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };

        return text.replace(/[&<>"']/g, function (m) {
            return map[m];
        });
    }


    grunt.registerMultiTask('mixdoc', 'Plugin that creates documentation on SASS mixins', function () {
        // Merge task-specific and/or target-specific options with these defaults.
        var options = this.options({
            styles_folder: './styles',
            dest_folder: './dest',
        });
        var debug = function (varname) {
            eval('console.log("' + varname + ' is", ' + varname + ');');
        }

        var fs = require("fs");
        var styles_folder = options.styles_folder;
        var dest_folder = options.dest_folder;

        var tokens = [];
        var files_to_compile = [];
        var files_to_search_mixins = [];

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
                var long_comments = content.match(/(\n|\r|^)\/\*([^\*]*)\*\/(\n|\r|\s*?)\@mixin\s([^\(]*)(?:\s?)([^\{]*)/g);
                if (long_comments) {
                    long_comments.forEach(function (str) {
                        var pieces = str.match(/(?:\n|\r|^)\/\*([^\*]*)\*\/(?:\n|\r|\s*?)\@mixin\s([^\(^\{]*)(?:\s?)([^\{]*)/i);
                        //console.log('pieces are', pieces);
                        //console.log('---------------------');
                        //return;
                        if (pieces !== null) {
                            var obj = {
                                descr: pieces[1],
                                mixin: pieces[2],
                                args: pieces[3],
                                filename: filename,
                                chapter: chapter,
                            }
                            var parts = obj.descr.match(/((.|\n(?!\n))*(\n\n|$))/g);
                            if (parts && parts.length > 1) {
                                if (parts.length > 3) {
                                    obj.descr = parts[1];
                                    obj.title = parts[0];
                                    obj.code = parts[2];
                                } else {
                                    obj.descr = parts[0];
                                    obj.code = parts[1];
                                    //console.log('parts are', parts);
                                }
                            }
                            //console.log('parts are', parts.length);
                            active.push(obj);
                        }
                    })
                }
            }
        }

        var files_to_parse = [];

        var list_files_and_dirs = function (path) {
            var files = fs.readdirSync(path);
            if (!files)
                return;
            files.forEach(function (file_or_folder) {
                var new_path = path + '/' + file_or_folder;
                if (fs.lstatSync(new_path).isDirectory()) {
                    list_files_and_dirs(new_path);
                } else {
                    files_to_parse.push(parse_file.bind(null, new_path, path.replace(styles_folder + "/", "")));
                    files_to_search_mixins.push(new_path);
                    files_to_compile.push(new_path);
                }
            })
        }
        list_files_and_dirs(styles_folder);
        //console.log('files_to_parse are', files_to_compile);
        for (var i in files_to_parse) {
            files_to_parse[i]();
        }
        console.log('Found', tokens.length, 'annotations');

        // Generating actual HTML

        var res = ['<!doctype html>\n\
        <link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/highlight.js/8.3/styles/default.min.css">\n\
        <script src="//cdnjs.cloudflare.com/ajax/libs/highlight.js/8.3/highlight.min.js"></script>\n\
        <script>hljs.initHighlightingOnLoad();</script>\n\
        <link rel="stylesheet" href="style.css">\n\
        '];
        res.push('<style>\n\
	body {font-family: Georgia, sans-serif;} \n\
        menu { box-shadow: 0px 3px 3px 0px rgb(161, 160, 160); z-index: 2;\n\
            height: 44px;\n\
            overflow: hidden;\n\
            background-color: grey; \n\
            padding: 0px 20px; \n\
            list-style: none; \n\
            text-align: left; \n\
            margin-top: -0px; \n\
            position: fixed;\n\
            border-bottom:1px solid grey;\n\
            width:1200px;} \n\
        menu > li:hover, menu > li:hover a {\n\
            background-color: whitesmoke;\n\
            color: grey;\n\
        }\n\
        menu > li {\n\
            text-align: center;\n\
            \n\
            background-color: grey;\n\
            display: inline-block;\n\
            padding: 10px;       \n\
                        \n\
         }\n\
menu > li a { color: white; background-color: grey;text-decoration: none;}\n\
	.wrapper { max-width: 1200px; margin: auto; margin-top: -1px; overflow: hidden;}\n\
	.doc-mixin { clear: both;border-top:1px solid grey;} \n\
	.doc-mixin > * {box-sizing: border-box; float:left;padding: 10px 0px;} \n\
        pre {margin: auto;} \n\
	h2 { text-transform: capitalize; font-weight: normal;font-size: 30px;margin: 0px;\n\
            padding: 30px 40px;border-top: 1px solid grey;} \n\
	.mixin { width: 20%;box-sizing: border-box;margin: 0px;font-size:15px;} \n\
	.mixin span {background-color: #3B9B23;color: white; padding: 5px;font-weight: normal;}\n\
	.doc-description { width:35%; padding-top:10px;} \n\
        .source {margin: 10px 0px; background-color: white;border: 1px solid grey;padding: 0px;font-size: 14px;} \n\
        .doc-description .title, .doc-description .descr, .doc-description .doc-code { margin: 0px 10px; } \n\
\n\
	.doc-code { } \n\
</style>');
        res.push('<div class="wrapper">');
        res.push('<menu>');
        
        var prev_chapter = false;
        tokens.forEach(function (token) {
            var chapter = token.chapter;
            if (chapter != prev_chapter) {
                res.push('<li><a href="#c' + chapter + '">' + chapter + '</a></li> ');
                prev_chapter = chapter;
            }
        });
        
        res.push(' <li style="width:1200px;"></li></menu><div style="height:43px;"></div>');

        prev_chapter = false;

        tokens.forEach(function (token) {
            var chapter = token.chapter;
            if (chapter != prev_chapter) {
                res.push('<div style="clear:both;"></div><h2 id="c' + chapter + '">' + chapter + '</h2>');
                prev_chapter = chapter;
            }
            res.push('<div class="doc-mixin">');
                res.push('<div class="mixin">\n\
                            <span>' + token.mixin + '</span>\n\
                            <div style="padding:5px">\n\
                                <div class="title" style="font-weight:bold">' + (token.title || '') + '</div>\n\
                                <div class="descr">' + token.descr + '</div>\n\
                                <div style="clear:both;"></div>\n\
                            </div>\n\
                        </div>\n\
                        ');
                res.push('<div class="doc-description">\n\
                            <div class="doc-code">' + (token.code || '') + '</div>\n\
                            <div style="clear:both;"></div>\n\
                        </div>');
                res.push('<div style="width:45%;float:left;padding:0px;"><div class="source"><pre><code class="html">' + (token.code ? escapeHtml(token.code.trim()) : '') + '</code></pre></div></div>');
            res.push('</div>');

        })
        res.push('<div style="clear:both;"></div></div>');

        if (!fs.existsSync(dest_folder)) {
            fs.mkdirSync(dest_folder);
        }

        //console.log('files_to_search_mixins', files_to_search_mixins);
        var all_mixins = ['@import "../style/main.scss";'];
        files_to_search_mixins.forEach(function (filename) {
            var content = fs.readFileSync(filename, {encoding: 'utf8'});
            if (content) {
                var mixins = content.match(/\@mixin\s([^\(]*)(?:\s?)([^\{]*)/g);
                //console.log('FOund mixins', mixins);
                if (!mixins)
                    return;
                mixins.forEach(function (mx) {
                    var mixin = mx.match(/\@mixin\s([^\(]*)(?:\s?)([^\{]*)/i);
                    var mixin_name = mixin[1];
                    all_mixins.push('\n.' + mixin_name + ' { @include ' + mixin_name + '();}');
                })
            }
        })

        fs.writeFileSync(dest_folder + '/mixins-to-classes.scss', all_mixins.join(""), {encoding: 'utf8'});
        fs.writeFileSync(dest_folder + '/index.html', res.join(""), {encoding: 'utf8'});
    });
};
