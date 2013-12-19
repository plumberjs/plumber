
// TODO:
//   * Handle RequireJS paths config somehow
//   * Break down files, add tests
//   * Represent resource type, check as input, provide as output
//   * Allow specifying multiple destinations by type
//   * Use Harmony modules and other patterns (let, etc)?

// TODO: try implement:
//   - glue (or similar)
//   - jshint
//   - karma

// TODO: usage:
//   luigi
//   luigi <pipeline>
//   luigi <pipeline> <files>


var q = require('q');

function execute(pipeline) {
  return pipeline.reduce(function(res, op) {
    return res.then(op);
  }, q());
}

function run(pipeline) {
    return execute(pipeline).then(function(dests) {
        dests.forEach(function(dest) {
            console.log("written to", dest.absolute());
        });
    }).catch(function(err) {
        // FIXME: why not caught by parent errback?
        console.log("Luigi failed: ", err.stack);
    });
}


var cwd = process.cwd();
var spec = require(cwd + '/Pipeline.js');

var pipelines = {};

spec(pipelines);

var pipelineArg = process.argv[2];
if (pipelineArg) {
    // Run specified pipeline
    var pipeline = pipelines[pipelineArg];
    console.log("Run pipeline: " + pipelineArg);
    if (! pipeline) {
        throw new Error('Pipeline not defined: ' + pipelineArg);
    }

    run(pipeline);

} else {
    // Run all pipelines
    Object.keys(pipelines).forEach(function(pipelineArg) {
        var pipeline = pipelines[pipelineArg];
        console.log("Run pipeline: " + pipelineArg);
        run(pipeline);
    });
}


// TODO: allow outputing to dir, regardless of number of resources
// to(resources, 'dist/');
// to(resources, 'dist'); // exists as a dir
// to(resources, luigi.dir('dist'));
// to(resources, {javascript: 'app.js', sourcemap: 'app.js.map'});

// TODO: create target directory if missing
