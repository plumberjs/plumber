var Report = require('../src/model/report');
var Supervisor = require('../src/util/supervisor');

var q = require('q');


function execute(pipeline, initialStep) {
    return pipeline.reduce(function(prevStep, operation) {
        var supervisor = new Supervisor();
        return {
            operation: operation,
            previous: prevStep,
            output: prevStep.output.then(function(res) {
                return operation(res, supervisor, prevStep);
            }),
            supervisor: supervisor
        };
    }, initialStep);
}


function run(pipeline) {
    var operations = pipeline.concat(
        outputReports,
        warnRemainingResources
    );

    var initialStep = {
        output: q([]),
        supervisor: new Supervisor()
    };
    return execute(operations, initialStep);
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
