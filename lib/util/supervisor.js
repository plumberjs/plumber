var Resource = require('../model/resource');

var mercator = require('mercator');
var SourceMap = mercator.SourceMap;
var readSourceMappingComment = mercator.readSourceMappingComment;
var stripSourceMappingComment = mercator.stripSourceMappingComment;

var fs       = require('fs');
var path     = require('path');
var globLib  = require('glob');
var highland = require('highland');

// Wrap event-emitter version of glob as a Highland stream
var glob = function(pattern) {
    var globNodeStream = new globLib.Glob(pattern);
    // FIXME: cleaner way to also listen for 'end'?
    var globStream = highland('match', globNodeStream);
    globNodeStream.on('end', globStream.end.bind(globStream));
    return globStream;
};

var readFile = highland.wrapCallback(fs.readFile);


function extractType(path) {
    var ext = path.split('.').slice(-1)[0];
    // FIXME: even if not matched, we should retain extension...
    return {
        js:     'javascript',
        coffee: 'coffeescript',
        css:    'css',
        less:   'less',
        html:   'html',
        json:   'json',
        jpg:    'jpeg',
        jpeg:   'jpeg',
        png:    'png',
        gif:    'gif'
    }[ext];
}

var typesSupportingSourceMaps = [
    'javascript',
    'css'
];

function supportsSourceMaps(type) {
    return typesSupportingSourceMaps.indexOf(type) !== -1;
}

function extractResource(filepath, rawData) {
    var sourceMapPromise;
    var type = extractType(filepath);
    var resource = new Resource({
        path: filepath,
        rawData: rawData,
        type: type
    });
    if (supportsSourceMaps(type)) {
        // At that point, we assume rawData is text
        var data = rawData.toString();
        // If the data contains a reference to the source map, extract
        // the source map as well
        var mapping = readSourceMappingComment(data);
        if (mapping) {
            var baseDir = path.dirname(filepath);
            var mappingPath = path.join(baseDir, mapping);
            sourceMapPromise = readFile(mappingPath, 'utf-8').map(SourceMap.fromMapData);
            // Strip source mapping reference from resource data
            resource = resource.withData(stripSourceMappingComment(data));
        }
    }

    // if no source map, stream of one "nothing"
    sourceMapPromise = sourceMapPromise || highland([null]);

    return sourceMapPromise.map(function(sourceMap) {
        return resource.withSourceMap(sourceMap);
    });
}

function filenameToResource(filepath) {
    return readFile(filepath).flatMap(function(rawData) {
        return extractResource(filepath, rawData);
    });
}


function Supervisor() {
    this.includes = [];
}

Supervisor.prototype.glob = function(pattern) {
    this.includes.push(pattern);
    // TODO: move this into plumber-glob?
    return highland([pattern]).
        flatMap(glob).
        flatMap(filenameToResource);
};

Supervisor.prototype.dependOn = function(file) {
    this.includes.push(file);
};


module.exports = Supervisor;
