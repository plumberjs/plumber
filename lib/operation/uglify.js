var UglifyJS = require('uglify-js');

var mapEachResource = require('../util/map-each-resource');


module.exports = function(/* no options */) {
    return mapEachResource(function(resource) {
        // TODO: filename, based on output spec? on input filename?
        var minResource = resource.withTransformation('minimised', 'min');
        var mapResource = minResource.withExtension('map');

        var sourceMapData = UglifyJS.SourceMap();
        var result = UglifyJS.minify(resource.path().absolute(), {
            outSourceMap: mapResource.filename(),
            source_map: sourceMapData
        });

        return [
            minResource.withData(result.code),
            mapResource.withData(sourceMapData.toString())
        ];
    });
};
