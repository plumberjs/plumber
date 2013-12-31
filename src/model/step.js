var Supervisor = require('../util/supervisor');

var q = require('q');
var gaze = require('gaze');
var flatten = require('flatten');


function Step(operation, previous) {
    this._supervisor = new Supervisor();
    this._operation = operation;
    this._previous = previous;
}

Step.prototype.output = function() {
    if (! this._output) {
        this._output = this._previous.output().then(function(res) {
            return this._operation(res, this._supervisor);
        }.bind(this));
    }
    return this._output;
};


// FIXME: cleanup
Step.prototype.monitor = function() {
    // if this supervisor sees change OR if previous changes
    var self = this;
    var defer = q.defer();
console.log("monitor", this._supervisor.includes)
    gaze(this._supervisor.includes, function() {
        this.on('all', function(event, filepath) {
            console.log("Re-run operation (changes)");
            // Prune cached output
            delete self._output;
            defer.resolve();
            // FIXME: internal operations in pipeline
            // FIXME: run vs execute
            // run(subpipeline, previous);
        });
    });
    this._previous.monitor().then(function() {
        console.log("Re-run operation (previous)");
        delete self._output;
        defer.resolve();
    });
    return defer.promise
};



function InitialStep() {}

InitialStep.prototype.output = function() {
    return q([]);
};

InitialStep.prototype.monitor = function() {
    return q.defer().promise; // never resolved
};


function MultiStep(pipelines, previous) {
    // FIXME: meh, cyclic dependency
    var execute = require('../core').execute;

    // FIXME: connect pipelines to local proxy for previous, rather than previous directly?
    this._lastSteps = pipelines.map(function(pipeline) {
        return execute(pipeline, previous);
    });
    this._previous = previous;
}

MultiStep.prototype.output = function() {
    return q.all(this._lastSteps.map(function(step) {
        return step.output();
    })).then(flatten);
};



MultiStep.prototype.monitor = function() {
    // if any sub-step sees change OR if previous changes
    var gaze = require('gaze');
    var defer = q.defer();
    console.log("monitor multi")
    this._lastSteps.forEach(function(step) {
        step.monitor().then(function() {
            console.log("Re-run multi (inside)");
            defer.resolve();
        });
    });
    this._previous.monitor().then(function() {
        console.log("Re-run multi (previous)");
        defer.resolve();
    });
    return defer.promise;
};


module.exports = {
    Step: Step,
    InitialStep: InitialStep,
    MultiStep: MultiStep
};
