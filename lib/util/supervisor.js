
var Resource = require('../model/resource');

var q = require('q');
var globLib = require('glob');
var glob = q.denodeify(globLib);


function filenameToResource(paths) {
    return paths.map(function(path) {
        return new Resource({path: path});
    });
}


function Supervisor() {
  this.includes = [];
}

Supervisor.prototype.glob = function(pattern) {
  this.includes.push(pattern);
  return glob(pattern).then(filenameToResource);
};


module.exports = Supervisor;
