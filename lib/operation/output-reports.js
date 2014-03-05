// TODO: move into CLI?

var operation = require('../core').operation;
var Report    = require('../model/report');

function outputReports() {
    // TODO: cleaner filter of resource vs report on stream?
    return operation(function(resourcesOrReport) {
        return resourcesOrReport.map(function(report) {
            if (Report.isReport(report)) {
                if (report.success) {
                    // FIXME: not necessarily written, maybe just passed test
                    if (report.type === 'write') {
                        console.log("written to", report.path.absolute());
                    } else {
                        console.log("success with", report.writtenResource.filename());
                    }
                } else {
                    console.error("error with", report.writtenResource.filename());
                    report.errors.forEach(function(error) {
                        console.error('[' + error.line + ':' + error.column + '] ' + error.message);
                        console.error(error.context);
                    });
                }
            }
            return report;
        });
    });
}

module.exports = outputReports;
