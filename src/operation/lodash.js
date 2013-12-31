var Resource = require('../model/resource');
var appendResources = require('../util/append-resources');

var pkg = require('lodash-cli/package.json');
var bin = pkg.bin.lodash;
var builder = require.resolve('lodash-cli/' + bin);

var q = require('q');
var spawn = require('child_process').spawn;


module.exports = function(options) {
    options = options || [];

    return appendResources(function() {
        var defer = q.defer();

        // FIXME: default options
        var defaultOptions = {
            modifier: 'strict',
            exports: 'amd'
        };

        // --stdout (instead of --output)
        // --debug (not minified)
        // --source-map
        var includes = 'include=' + (options.include || []).join(',');
        var args = [includes, '--stdout', '--debug', 'exports=amd', 'strict'];

        var build = spawn(builder, args);
        var output;
        build.stdout.on('data', function(data) {
            output = String(data);
        });
        build.stderr.on('data', function(data) {
            // FIXME: reject defer?
            console.log("stderr", data)
        });
        build.on('close', function(code) {
            // FIXME: inspect code to see if success or not
            // console.log("done", code)
            defer.resolve(new Resource({
                filename: 'lodash.js',
                data: output
            }));
        });

        return defer.promise;
    });
};
