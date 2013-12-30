var flatten = require('flatten');

function mapEachResource(func) {
    return function(resources) {
        return flatten(resources.map(func));
    };
}

module.exports = mapEachResource;
