var Resource = require('../model/resource');

var mercator = require('mercator');
var SourceMap = mercator.SourceMap;
var readSourceMappingComment = mercator.readSourceMappingComment;
var stripSourceMappingComment = mercator.stripSourceMappingComment;

var fs       = require('fs');
var path     = require('path');
var globLib  = require('glob');
var Rx       = require('rx');

// Wrap event-emitter version of glob as an Observable
var glob = function(pattern) {
    var globEvents = new globLib.Glob(pattern);
    var matches = Rx.Node.fromEvent(globEvents, 'match');
    var end     = Rx.Node.fromEvent(globEvents, 'end');
    return matches.takeUntil(end);
};

var readFile = Rx.Observable.fromNodeCallback(fs.readFile);


function extractType(path) {
    var ext = path.split('.').slice(-1)[0];
    // FIXME: even if not matched, we should retain extension...
    return {
        js:     'javascript',
        coffee: 'coffeescript',
        css:    'css',
        scss:   'scss',
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
            sourceMapPromise = readFile(mappingPath, 'utf-8').
                // Filter empty files
                filter(function (x) { return x; }).
                catch(function (error) {
                    if (error.code === 'ENOENT') {
                        // FIXME: Generate a report instead of console logging here
                        // As per: https://github.com/plumberjs/plumber/issues/19
                        var tempError = new Error('Source map file could not be found for ' + filepath + '.');
                        console.error(tempError.stack);
                        return Rx.Observable.empty();
                    } else {
                        throw error;
                    }
                }).
                map(SourceMap.fromMapData);
            // Strip source mapping reference from resource data
            resource = resource.withData(stripSourceMappingComment(data));
        }
    }

    // if no source map, stream of one "nothing"
    sourceMapPromise = sourceMapPromise || Rx.Observable.return(null);

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

Supervisor.prototype.glob = function(pattern, Rxx) {
    this.includes.push(pattern);
    // TODO: move this into plumber-glob?
    return Rx.Observable.return(pattern).
        flatMap(glob).
        flatMap(filenameToResource);
};

Supervisor.prototype.dependOn = function(file) {
    this.includes.push(file);
};


module.exports = Supervisor;
