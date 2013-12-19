var Resource = require('../model/resource');
var stringToPath = require('../util/string-to-path');

var q = require('q');
var fs = require('fs');

var writeFile = q.denodeify(fs.writeFile);

module.exports = function(destination) {
    return function(resources) {
        var destPath = stringToPath(destination);

        // Trying to output multiple resources into a single file? That won't do
        if (resources.length > 1 && ! destPath.isDirectory()) {
            // FIXME: error now outputted ?
            return q.reject(new Error('Cannot write multiple resources to a single file: ' + destPath.absolute()));
        }

        return q.all(resources.map(function(resource) {
            var destFile;
            if (destPath.isDirectory()) {
                destFile = destPath.withFilename(resource.filename());
            } else {
                destFile = destPath;
            }

            return writeFile(destFile.absolute(), resource.data()).thenResolve(destFile);
        }));
    };
};
