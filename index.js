var core = require('./lib/core');

var Resource = require('./lib/model/resource');
var Report   = require('./lib/model/report');
var steps    = require('./lib/model/step');

var appendResources = require('./lib/util/append-resources');
var mapEachResource = require('./lib/util/map-each-resource');
var stringToPath    = require('./lib/util/string-to-path');

module.exports = {
    execute: core.execute,
    run: core.run,
    Resource: Resource,
    Report: Report,
    Step: steps.Step,
    InitialStep: steps.InitialStep,
    MultiStep: steps.MultiStep,
    // TODO: move to plumber-util package?
    appendResources: appendResources,
    mapEachResource: mapEachResource,
    stringToPath: stringToPath
};
