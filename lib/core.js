var highland = require('highland');
var flatten = require('flatten');

function parse(chain) {
    var pipeline = assemble(chain, start());
    return {
        run: function() {
            var single = pipeline.take(1);
            single.each(function(resources) {
                resources.resume();
            });
            return single;
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
    // FIXME: which one works best for supporting watch?
    // Infinite stream of empty streams
    // var executions = highland(function(push, next) {
    //     push(null, highland([]));
    //     push(null, highland.nil);
    //     // next();
    // });

    // A stream of a single empty stream
    var executions = highland([highland([])]);

    return executions;
}


// TODO: move elsewhere

function operation(mapper) {
    return function(executions) {
        return executions.map(mapper);
    };
}

/** Helper that applies a function to each resource */
operation.map(function(mapper) {
    return operation(function(resources) {
        resources.map(mapper);
    });
});


module.exports = {
    parse: parse,
    assemble: assemble,
    operation: operation
};
