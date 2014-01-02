var core = require('./core');
var Resource = require('./model/resource');
var Report = require('./model/report');
var steps = require('./model/step');
var appendResources = require('./util/append-resources');
var mapEachResource = require('./util/map-each-resource');
var stringToPath = require('./util/string-to-path');

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
