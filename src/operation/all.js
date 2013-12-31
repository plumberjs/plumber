var q = require('q');
var flatten = require('flatten');

var execute = require('../core').execute;

module.exports = function(/* pipelinesOrOperations... */) {
    // Turn all operations into pipelines (i.e. arrays)
    var pipelinesOrOperations = [].slice.call(arguments);
    var pipelines = pipelinesOrOperations.map(function(pipeOrOp) {
        return flatten([pipeOrOp]);
    });

    return function(resources, _, prevStep) {
        return q.all(pipelines.map(function(pipeline) {
            // FIXME: expose subpipeline in Step chain by returning step, not resources
            return execute(pipeline, prevStep).output;
        })).then(flatten);
    };
};
