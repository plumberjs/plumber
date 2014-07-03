var pkg = require('./package');

var core = require('./lib/core');

var Resource = require('./lib/model/resource');
var Report   = require('./lib/model/report');

var stringToPath = require('./lib/util/string-to-path');

var Supervisor = require('./lib/util/supervisor');

var Rx = require('rx');

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
    // FIXME: expose Rx instance for other modules to use
    // This is to work around a bug (?) whereby when each module
    // gets its own Rx instance (through the "magic" of Node/NPM),
    // they don't work well together.
    // See: https://github.com/Reactive-Extensions/RxJS/issues/187
    Rx: Rx,
    // TODO: move to plumber-cli
    outputReports: outputReports,
    warnRemainingResources: warnRemainingResources
};
