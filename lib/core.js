var steps = require('../lib/model/step');
var Step = steps.Step;
var InitialStep = steps.InitialStep;
var MultiStep = steps.MultiStep;

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


// TODO: move out of here

function isReport(obj) {
    // FIXME: saner heuristic? (can't use instanceof, might not be same ctor function)
    return 'writtenResource' in obj;
}

function outputReports(resources) {
    // FIXME: use partition instead?
    var reports = resources.filter(isReport);

    reports.forEach(function(report) {
        if (report.success) {
            // FIXME: not necessarily written, maybe just passed test
            if (report.type === 'write') {
                console.log("written to", report.writtenResource.absolute());
            } else {
                console.log("success with", report.writtenResource.filename());
            }
        } else {
            // FIXME: show error
            console.log("error with", report.writtenResource.filename());
            report.errors.forEach(function(error) {
                console.log('[' + error.line + ':' + error.column + '] ' + error.message);
                console.log(error.context);
            });
        }
    });

    return resources.filter(function(output) {
        return ! isReport(output);
    });
}

function warnRemainingResources(resources) {
    if (resources.length > 0) {
        console.log(resources.length + ' unprocessed resources:');
        resources.forEach(function(other) {
            console.log(other.filename());
        });
    }
}



module.exports = {
    run: run,
    execute: execute
};
