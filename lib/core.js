var steps = require('../lib/model/step');
var Step = steps.Step;
var InitialStep = steps.InitialStep;
var MultiStep = steps.MultiStep;

var outputReports = require('./operation/output-reports');
var warnRemainingResources = require('./operation/warn-remaining-resources');

function execute(pipeline, initialStep) {
    return pipeline.reduce(function(prevStep, operation) {
        // FIXME: hacky!
        if (typeof operation === 'function') {
            return new Step(operation, prevStep);
        } else {
            return new MultiStep(operation, prevStep);
        }
    }, initialStep);
}


function run(pipeline) {
    var operations = pipeline.concat(
        outputReports,
        warnRemainingResources
    );

    return execute(operations, new InitialStep());
}

module.exports = {
    run: run,
    execute: execute
};
