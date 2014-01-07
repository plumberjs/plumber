var glob      = require('plumber-glob');
var uglify    = require('plumber-uglifyjs')();
var concat    = require('plumber-concat');
var requirejs = require('plumber-requirejs')();
var hash      = require('plumber-hash')();
var less      = require('plumber-less')();
var write     = require('plumber-write');

module.exports = function(pipelines) {

    var sources = 'src/**/*.js';
    var dest = 'out';
    var writeToOut = write('out');

    // Pass all JS files through pipeline
    pipelines['concat'] = [glob(sources), uglify, concat('all'), writeToOut];

    // Minify all files and write to out directory
    pipelines['uglify'] = [glob('src/*.js'), uglify, writeToOut];

    // Minify all files and try to write to single file -- FAILS!
    pipelines['uglify-fail'] = [glob('src/*.js'), uglify, write('out/singlefile.js')];

    // Copying is just an empty pipeline to a new file
    pipelines['copy-one'] = [glob('src/some.js'), write('out/some.copy.js')];
    pipelines['copy-to-dir'] = [glob('src/some.js'), write('out')];

    // Pass all JS files through pipeline
    pipelines['rjs'] = [glob('src/amd.js'), requirejs, write('out/amd.js')];

    // Hash all files and write renamed version and mapping
    pipelines['hash'] = [glob('src/*.js'), hash, write('out')];

    // Pass LESS files to less
    pipelines['less'] = [glob('src/*.less'), less, write('out')];

};
