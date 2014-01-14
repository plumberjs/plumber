var core = require('./lib/core');

var Resource = require('./lib/model/resource');
var Report   = require('./lib/model/report');
var steps    = require('./lib/model/step');

var stringToPath    = require('./lib/util/string-to-path');
var appendResources = require('./lib/util/append-resources');
var mapEachResource = require('./lib/util/map-each-resource');
var mapEachResourceSerially = require('./lib/util/map-each-resource-serially');

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
    mapEachResourceSerially: mapEachResourceSerially,
    stringToPath: stringToPath
};
