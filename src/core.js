var Report = require('../src/model/report');

var steps = require('../src/model/step');
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

function outputReports(resources) {
    // FIXME: use partition instead?
    var reports = resources.filter(function(output) {
        return output instanceof Report;
    });

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
            console.log(report.errors);
        }
    });

    return resources.filter(function(output) {
        return ! (output instanceof Report);
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
