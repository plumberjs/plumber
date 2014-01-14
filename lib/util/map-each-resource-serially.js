var q = require('q');

// In case an operation is not concurrency-safe, this allows to run the map serially.
function mapEachResourceSerially(func) {
    return function(resources, supervisor) {
        return resources.reduce(function(previous, resource) {
            return previous.then(function(prevOutputs) {
                return q(func(resource, supervisor)).then(function(currOutputs) {
                    return prevOutputs.concat(currOutputs);
                });
            });
        }, q([]));
    };
}

module.exports = mapEachResourceSerially;
