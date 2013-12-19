var Resource = require('../model/resource');

var q = require('q');
var requirejs = require('requirejs');
var fs = require('fs');

var readFile = q.denodeify(fs.readFile);
var unlink = q.denodeify(fs.unlink);

module.exports = function(/* no options */) {
    return function(resources) {

        // wrap requirejs.optimize as a promise
        function optimize(options) {
            var defer = q.defer();
            requirejs.optimize(options, function(response) {
                defer.resolve(response);
            });
            // FIXME: error reject?
            return defer.promise;
        }

        if (resources.length > 1) {
            // TODO: optimize each
        } else {
            var resource = resources[0];
            // TODO: accept directory as input resource
            if (false && resource.isDirectory()) {
                // TODO: optimize whole directory
            } else {
                var pathNoExt = resource.path().filename().replace(/\.js$/, '');
                var tmpFile = 'rjsout.js'; // TODO: generate filename in tmp folder

                var options = {
                    // FIXME: do we always want to use baseUrl?
                    //        or as explicit luigi scope?
                    baseUrl: resource.path().dirname(),
                    name: pathNoExt,
                    out: tmpFile
                };

                return optimize(options).then(function() {
                    // FIXME: don't hardcode encoding?
                    return readFile(tmpFile, 'utf-8');
                }).then(function(compiledData) {
                    // Cleanup temporary file
                    unlink(tmpFile);

                    // and return generated data as a resource
                    return [new Resource({
                        filename: resource.path(),
                        data: compiledData
                    })];
                });
            }
        }
    };
};
