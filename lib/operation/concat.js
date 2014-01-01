var Resource = require('../model/resource');

module.exports = function(/* no options */) {
    return function(resources) {
        var concatenated = resources.reduce(function(acc, resource) {
            return acc + resource.data();
        }, '');
        return [new Resource({data: concatenated})];
    };
};
