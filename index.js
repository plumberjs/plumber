var pkg = require('./package');

var core = require('./lib/core');

var Resource = require('./lib/model/resource');
var Report   = require('./lib/model/report');

var stringToPath = require('./lib/util/string-to-path');

var Supervisor = require('./lib/util/supervisor');

var outputReports = require('./lib/operation/output-reports');
var warnRemainingResources = require('./lib/operation/warn-remaining-resources');

module.exports = {
    VERSION: pkg.version,
    parse:     core.parse,
    assemble:  core.assemble,
    operation: core.operation,
    Resource: Resource,
    Report: Report,
    // TODO: move to plumber-util package?
    stringToPath: stringToPath,
    // TODO: abstract differently?
    Supervisor: Supervisor,
    // TODO: move to plumber-cli
    outputReports: outputReports,
    warnRemainingResources: warnRemainingResources
};
