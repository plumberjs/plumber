var core = require('./core');
var Report = require('./model/report');
var steps = require('./model/step');
var appendResources = require('./util/append-resources');

module.exports = {
    execute: core.execute,
    run: core.run,
    Report: Report,
    Step: steps.Step,
    InitialStep: steps.InitialStep,
    MultiStep: steps.MultiStep,
    // TODO: move to plumber-util package?
    appendResources: appendResources
};
