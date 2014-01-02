var q = require('q');
var flatten = require('flatten');

function mapEachResource(func) {
    return function(resources, supervisor) {
        function funcProxy(resource) {
            return func(resource, supervisor);
        }
        return q.all(resources.map(funcProxy)).then(flatten);
    };
}

module.exports = mapEachResource;
