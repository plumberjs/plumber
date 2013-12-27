var Resource = require('../model/resource');

var q = require('q');

module.exports = function(newName) {
    return function(resources) {
        if (resources.length > 1) {
            return q.reject(new Error('Cannot rename multiple resources to ' + newName));
        }

        var resource = resources[0];
        return [new Resource({
            // FIXME: should just accept path object as is
            path:     resource.path().absolute(),
            data:     resource.data(),
            filename: newName
        })];
    };
};
