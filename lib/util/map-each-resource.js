var q = require('q');
var flatten = require('flatten');

function mapEachResource(func) {
    return function(resources) {
        return q.all(resources.map(func)).then(flatten);
    };
}

module.exports = mapEachResource;
