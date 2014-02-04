
var Resource = require('../model/resource');

var q = require('q');
var fs = require('fs');
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

function filenameToResource(paths) {
    return paths.map(function(path) {
        return readFile(path, 'utf-8').then(function(data) {
            return new Resource({
                path: path,
                data: data,
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
