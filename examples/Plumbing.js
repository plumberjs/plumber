var glob      = require('plumber-glob');
var uglify    = require('plumber-uglifyjs')();
var concat    = require('plumber-concat');
var requirejs = require('plumber-requirejs')();
var hash      = require('plumber-hash')();
var less      = require('plumber-less')();
var write     = require('plumber-write');

module.exports = function(pipelines) {

    var sources = 'examples/**/*.js';
    var dest = 'out';
    var writeToOut = write('out');

    // Pass all JS files through pipeline
    pipelines['concat'] = [glob('examples/*.js'), uglify, concat('all'), writeToOut];

    // Minify all files and write to out directory
    pipelines['uglify'] = [glob('examples/*.js'), uglify, writeToOut];

    // Minify all files and try to write to single file -- FAILS!
    pipelines['uglify-fail'] = [glob('examples/*.js'), uglify, write('out/singlefile.js')];

    // Copying is just an empty pipeline to a new file
    pipelines['copy-one'] = [glob('examples/some.js'), write('out/some.copy.js')];
    pipelines['copy-to-dir'] = [glob('examples/some.js'), write('out')];

    // Pass all JS files through pipeline
    pipelines['rjs'] = [glob('examples/amd.js'), requirejs, write('out/amd.js')];

    // Hash all files and write renamed version and mapping
    pipelines['hash'] = [glob('examples/*.js'), hash, write('out')];

    // Pass LESS files to less
    pipelines['less'] = [glob('examples/*.less'), less, write('out')];

};
