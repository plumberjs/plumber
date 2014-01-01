var Report = require('plumber').Report;

var stringToPath = require('../util/string-to-path');

var q = require('q');
var fs = require('fs');
var mkdirpNode = require('mkdirp');

var mkdirp = q.denodeify(mkdirpNode);

var writeFile = q.denodeify(fs.writeFile);


function createReport(resource) {
    return new Report({
        resource: resource,
        type: 'write'
    });
}


// FIXME: don't accept varia-type argument; use separate helpers?
module.exports = function(destination) {
    return function(resources) {
        var getDest;

        if (typeof destination === 'string') {
            var destPath = stringToPath(destination);

            // Trying to output multiple resources into a single file? That won't do
            if (resources.length > 1 && ! destPath.isDirectory()) {
                // FIXME: error now outputted ?
                return q.reject(new Error('Cannot write multiple resources to a single file: ' + destPath.absolute()));
            }

            getDest = function() { return destPath; };
        } else if (typeof destination === 'function') {
            getDest = function(resource) {
                return stringToPath(destination(resource));
            };
        }

        return q.all(resources.map(function(resource) {
            var destPath = getDest(resource);

            var destFile;
            if (destPath.isDirectory()) {
                destFile = destPath.withFilename(resource.filename());
            } else {
                destFile = destPath;
            }

            return mkdirp(destFile.dirname()).then(function() {
                return writeFile(destFile.absolute(), resource.data()).thenResolve(createReport(destFile));
            });
        }));
    };
};
