var Supervisor = require('../util/supervisor');

var q = require('q');
var gaze = require('gaze');
var flatten = require('flatten');


function gazePromise(files) {
    var defer = q.defer();
    gaze(files, function() {
        this.on('all', function(event, filepath) {
            defer.resolve();
        });
    });
    return defer.promise;
}


// Return a promise that resolves when any of the promises in the list resolves
function any(/* promises... */) {
    var defer = q.defer();
    var promises = flatten([].slice.call(arguments));
    promises.forEach(function(promise) {
        promise.then(defer.resolve);
    });
    return defer.promise;
}


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


Step.prototype.monitor = function() {
console.log("monitor", this._supervisor.includes)

    // if this supervisor sees change OR if previous changes
    var filesChanged = gazePromise(this._supervisor.includes).then(function() {
        console.log("Re-run operation (changes)");
    });
    var previousChanged = this._previous.monitor().then(function() {
        console.log("Re-run operation (previous)");
    });

    return any(filesChanged, previousChanged).then(function() {
        // Prune cached output
        delete this._output;
    }.bind(this));
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
    console.log("monitor multi")

    // if any sub-step sees change OR if previous changes
    var subChanged = any(this._lastSteps.map(function(step) {
        return step.monitor();
    })).then(function() {
        console.log("Re-run multi (inside)");
    });

    var previousChanged = this._previous.monitor().then(function() {
        console.log("Re-run multi (previous)");
    });

    return any(subChanged, previousChanged);
};


module.exports = {
    Step: Step,
    InitialStep: InitialStep,
    MultiStep: MultiStep
};
