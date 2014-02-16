var steps = require('../lib/model/step');
var Step = steps.Step;
var InitialStep = steps.InitialStep;
var MultiStep = steps.MultiStep;

var outputReports = require('./operation/output-reports');
var warnRemainingResources = require('./operation/warn-remaining-resources');

function execute(pipeline, initialStep, options) {
    return pipeline.reduce(function(prevStep, operation) {
        // FIXME: hacky!
        if (typeof operation === 'function') {
            return new Step(operation, prevStep, options);
        } else {
            return new MultiStep(operation, prevStep, options);
        }
    }, initialStep);
}


function run(pipeline, options) {
    var operations = pipeline.concat(
        outputReports,
        warnRemainingResources
    );

    return execute(operations, new InitialStep(), options);
}

module.exports = {
    run: run,
    execute: execute
};
