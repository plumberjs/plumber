var Rx      = require('rx');
var flatten = require('flatten');

function parse(chain) {
    var pipeline = assemble(chain, start());
    return {
        run: function() {
            return pipeline;
        },
        watch: function() {
            // TODO: support?
            console.error("Watch not supported yet");
        }
    };
}

function assemble(chain, executions) {
    return asPipeline(chain).reduce(function(exec, op) {
        return op(exec);
    }, executions);
}



/* == Internals == */

/**
 * Turn an operation or a chain into a flat pipeline (i.e. array of
 * operations)
 */
function asPipeline(chainOrOperation) {
    return flatten([chainOrOperation]);
}

/**
 * Initial step in pipeline.
 */
function start() {
    // A stream of a single empty stream
    var initialResources = Rx.Observable.empty();
    var executions = Rx.Observable.return(initialResources);

    return executions;
}


// TODO: move elsewhere

function operation(mapper) {
    return function(executions) {
        return executions.map(mapper);
    };
}

/** Helper that applies a function to each resource */
operation.map = function(mapper) {
    return operation(function(resources) {
        return resources.map(mapper);
    });
};

/** Helper that applies a function to each resource, running all in
 * parallel (mapper returns a stream) */
operation.parallelFlatMap = function(mapper) {
    return operation(function(resources) {
        return resources.map(mapper).mergeAll();
    });
};

/** Helper that applies a function to each resource, running each
 * sequentially (mapper returns a stream) */
operation.serialFlatMap = function(mapper) {
    return operation(function(resources) {
        return resources.map(mapper).concatAll();
    });
};

/** Helper that takes a generator of executions and concatenates it
 *  to the existing stream of executions */
operation.concatExecutions = function(generator) {
    return function(executions) {
        return executions.combineLatest(generator(), function(current, generated) {
            return current.concat(generated);
        });
    };
};

/** Helper that passes through existing resources and concatenates
 * extra ones */
operation.concat = function(generator) {
    return operation(function(resources) {
        return resources.concat(generator());
    });
};

/** Helper that passes through existing resources and concatenates
 * extra ones */
operation.concatAll = function(generator) {
    return operation(function(resources) {
        return resources.concatAll(generator());
    });
};


module.exports = {
    parse: parse,
    assemble: assemble,
    operation: operation
};
