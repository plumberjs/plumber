var glob = require('./src/operation/glob');
var uglify = require('./src/operation/uglify')();
var concat = require('./src/operation/concat')();
var requirejs = require('./src/operation/requirejs')();
var hash = require('./src/operation/hash')();
var less = require('./src/operation/less')();
var write = require('./src/operation/write');

module.exports = function(luigi) {

    var sources = 'examples/**/*.js';
    var dest = 'out/out.js';
    var compile = [glob(sources), uglify, concat, write(dest)];

    luigi['compile'] = compile;

    // Pass all JS files through pipeline
    luigi['concat'] = [glob('examples/*.js'), uglify, concat, write('out/out.js')];

    // Minify all files and write to out directory
    luigi['uglify'] = [glob('examples/*.js'), uglify, write('out')];

    // Minify all files and try to write to single file -- FAILS!
    luigi['uglify-fail'] = [glob('examples/*.js'), uglify, write('out/singlefile.js')];

    // Copying is just an empty pipeline to a new file
    luigi['copy-one'] = [glob('examples/some.js'), write('out/some.copy.js')];
    luigi['copy-to-dir'] = [glob('examples/some.js'), write('out')];

    // Pass all JS files through pipeline
    luigi['rjs'] = [glob('examples/amd.js'), requirejs, write('out/amd.js')];

    // Hash all files and write renamed version and mapping
    luigi['hash'] = [glob('examples/*.js'), hash, write('out')];

    // Pass LESS files to less
    luigi['less'] = [glob('examples/*.less'), less, write('out')];

};
