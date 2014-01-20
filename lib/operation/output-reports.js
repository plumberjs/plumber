
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
            // print error
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

module.exports = outputReports;
