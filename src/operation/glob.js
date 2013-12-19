var Resource = require('../model/resource');

var q = require('q');
var globLib = require('glob');
var flatten = require('flatten');

var glob = q.denodeify(globLib);


function filenameToResource(paths) {
    return paths.map(function(path) {
        return new Resource({path: path});
    });
}

module.exports = function(files) {
    return function(/* TODO: resources? */) {
        return q.
            // needed to avoid passing more map arguments to glob
            all(files.map(function(f){ return glob(f); })).
            then(flatten).
            then(filenameToResource);
    };
};
