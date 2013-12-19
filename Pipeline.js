module.exports = function(luigi) {

    var sources = 'examples/**/*.js';
    var compile = ['uglify', 'concat'];
    var dest = 'out/out.js';

    // luigi.as('compile').send(sources, compile).to(dest);
    luigi.as('compile').find(sources).run(compile).write(dest);


    // Pass all JS files through pipeline
    luigi.as('concat').find('examples/*.js').run(['uglify', 'concat']).write('out/out.js');

    // Minify all files and write to out directory
    luigi.as('uglify').find('examples/*.js').run(['uglify']).write('out');

    // Minify all files and try to write to single file -- FAILS!
    luigi.as('uglify-fail').find('examples/*.js').run(['uglify']).write('out/singlefile.js');

    // Copying is just an empty pipeline to a new file
    luigi.as('copy-one').find('examples/some.js').run([]).write('out/some.copy.js');
    luigi.as('copy-to-dir').find('examples/some.js').run([]).write('out');

    // Pass all JS files through pipeline
    luigi.as('rjs').find(['examples/amd.js']).run(['requirejs']).write('out/amd.js');

    // Hash all files and write renamed version and mapping
    luigi.as('hash').find('examples/*.js').run(['hash']).write('out');

    // Pass LESS files to less
    luigi.as('less').find('examples/*.less').run(['less']).write('out');

};
