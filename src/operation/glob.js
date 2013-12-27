var Resource = require('../model/resource');

var q = require('q');
var path = require('path');
var globLib = require('glob');
var flatten = require('flatten');

var glob = q.denodeify(globLib);

function identity(x){ return x; }

// FIXME: native helper?
// compose(f, g)(x) == f(g(x))
function compose(f, g) {
    return function() {
        return f(g.apply(null, arguments));
    };
}

function filenameToResource(paths) {
    return paths.map(function(path) {
        return new Resource({path: path});
    });
}

function globOperation(mapper) {
    function op(/* files... */) {
        var fileList = flatten([].slice.call(arguments));
        if (mapper) {
            fileList = fileList.map(mapper);
        }
        return function(/* TODO: resources? */) {
            return q.
                // needed to avoid passing more map arguments to glob
                all(fileList.map(function(f){ return glob(f); })).
                then(flatten).
                then(filenameToResource);
        };
    };

    // recursively compose mappers
    op.within = function(directory) {
        return globOperation(compose(mapper, function(file) {
            return path.join(directory, file);
        }));
    };

    return op;
};

module.exports = globOperation(identity);
