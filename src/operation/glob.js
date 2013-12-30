var appendResources = require('../util/append-resources');

var q = require('q');
var path = require('path');
var flatten = require('flatten');

function identity(x){ return x; }

// FIXME: native helper?
// compose(f, g)(x) == f(g(x))
function compose(f, g) {
    return function() {
        return f(g.apply(null, arguments));
    };
}

function globOperation(mapper) {
    function glob(/* files... */) {
        var fileList = flatten([].slice.call(arguments)).map(mapper);
        return appendResources(function(supervisor) {
            var glob = supervisor.glob.bind(supervisor);
            return q.all(fileList.map(glob)).then(flatten);
        });
    };

    // recursively compose mappers
    glob.within = function(directory) {
        return globOperation(compose(mapper, function(file) {
            return path.join(directory, file);
        }));
    };

    return glob;
};

module.exports = globOperation(identity);
