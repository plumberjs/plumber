
var Resource = require('../model/resource');

var mercator = require('mercator');
var SourceMap = mercator.SourceMap;
var readSourceMappingComment = mercator.readSourceMappingComment;
var stripSourceMappingComment = mercator.stripSourceMappingComment;

var q = require('q');
var fs = require('fs');
var path = require('path');
var globLib = require('glob');
var glob = q.denodeify(globLib);
var readFile = q.denodeify(fs.readFile);

function extractType(path) {
    var ext = path.split('.').slice(-1)[0];
    // FIXME: even if not matched, we should retain extension...
    return {
        js:   'javascript',
        css:  'css',
        less: 'less',
        html: 'html',
        json: 'json'
    }[ext];
}

// If the data contains a reference to the source map, extract the
// source map as well
function extractDataAndSourceMap(filepath, data) {
    var mapping = readSourceMappingComment(data);
    var sourceMapPromise;
    if (mapping) {
        var baseDir = path.dirname(filepath);
        var mappingPath = path.join(baseDir, mapping);
        sourceMapPromise = readFile(mappingPath, 'utf-8').then(function(sourceMapData) {
            return SourceMap.fromMapData(sourceMapData);
        });
    } else {
        // no source map, empty promise
        sourceMapPromise = q();
    }

    return sourceMapPromise.then(function(sourceMap) {
        return [stripSourceMappingComment(data), sourceMap];
    });
}

function filenameToResource(paths) {
    return paths.map(function(path) {
        return readFile(path, 'utf-8').then(function(data) {
            return extractDataAndSourceMap(path, data);
        }).spread(function(data, sourceMap) {
            return new Resource({
                path: path,
                data: data,
                sourceMap: sourceMap,
                type: extractType(path)
            });
        });
    });
}


function Supervisor() {
  this.includes = [];
}

Supervisor.prototype.glob = function(pattern) {
  this.includes.push(pattern);
  return glob(pattern).then(filenameToResource);
};

Supervisor.prototype.dependOn = function(file) {
  this.includes.push(file);
};


module.exports = Supervisor;
