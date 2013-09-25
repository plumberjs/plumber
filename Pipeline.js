module.exports = function(luigi) {

    var sources = 'examples/**/*.js';
    var compile = ['uglify', 'concat'];
    var dest = 'out/out.js';

    // luigi.as('compile').send(sources, compile).to(dest);
    luigi.as('compile').find(sources).run(compile).write(dest);

};
