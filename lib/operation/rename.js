var q = require('q');

module.exports = function(newName) {
    return function(resources) {
        if (resources.length > 1) {
            return q.reject(new Error('Cannot rename multiple resources to ' + newName));
        }

        return [resources[0].copy({filename: newName})];
    };
};
