var UglifyJS = require('uglify-js');
var flatten = require('flatten');

var Resource = require('../model/resource');

module.exports = function(/* no options */) {
    return function(resources) {

        // TODO: typed? var javascripts = resources.filter('javascript');

        return flatten(resources.map(function(resource) {
            // TODO: filename, based on output spec? on input filename?
            var minFilename = resource.filename().replace('.js', '.min.js');
            var sourceMapFilename = minFilename + '.map';

            var sourceMapData = UglifyJS.SourceMap();
            var result = UglifyJS.minify(resource.path().absolute(), {
                outSourceMap: sourceMapFilename,
                source_map: sourceMapData
            });

            var uglyFile = new Resource({
                filename: minFilename,
                data: result.code
            });

            var sourceMap = new Resource({
                filename: sourceMapFilename,
                data: sourceMapData.toString()
            });

            return [uglyFile, sourceMap];
        }));
    };
};
