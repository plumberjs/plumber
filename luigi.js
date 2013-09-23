
var luigi = {
    define: function(name, operation) {
        if (this.__operations[name]) {
            throw new Error('operation already defined: ' + name);
        }
        this.__operations[name] = operation;
    },

    operation: function(name) {
        var operation = this.__operations[name];
        if (! operation) {
            throw new Error('undefined operation: ' + name);
        }
        return operation;
    },

    // dir: function(path) {
    //     return new Destination(path, true);
    // },

    __operations: {}
};



// TODO: try implement:
//   - hash
//   - less
//   - glue (or similar)
//   - karma

// TODO: usage:
//   luigi
//   luigi <pipeline>
//   luigi <pipeline> <files>


luigi.define('uglify', function(resources) {
    var UglifyJS = require("uglify-js");

    // TODO: typed? var javascripts = resources.filter('javascript');

    return resources.map(function(resource) {
        var result = UglifyJS.minify(resource.path(), {
            outSourceMap: "out.js.map"
            // TODO: iff requested? filename, based on output spec? on input filename?
            // TODO: return as resource?
        });
        return resource.derive({data: result.code});
    });
});


luigi.define('concat', function(resources) {
    var concatenated = resources.reduce(function(acc, resource) {
        return acc + resource.data();
    }, '');
    return [new Resource({data: concatenated})];
});


luigi.define('requirejs', function(resources) {
    var requirejs = require('requirejs');

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
            var pathNoExt = resource.path().replace(/\.js$/, '');
            var tmpFile = 'rjsout.js'; // TODO: generate filename in tmp folder
            var options = {
                name: pathNoExt,
                out: tmpFile
            };

            return optimize(options).then(function() {
                // FIXME: don't hardcode encoding?
                return readFile(tmpFile, {encoding: 'utf-8'});
            }).then(function(compiledData) {
                // Cleanup temporary file
                unlink(tmpFile);

                // and return generated data as a resource
                return [resource.derive({data: compiledData})];
            });
        }
    }
});




var fs = require('fs');
var q = require('q');

var glob = q.denodeify(require('glob'));
var writeFile = q.denodeify(fs.writeFile);
var readFile = q.denodeify(fs.readFile);
var unlink = q.denodeify(fs.unlink);


function Resource(properties) {
    properties = properties || {};

    // TODO: record filename, by default map to same filename
    this._path = properties.path;
    this._data = properties.data;
}

Resource.prototype.path = function() {
    return this._path;
};

Resource.prototype.filename = function() {
    if (this._path) {
        // TODO: return filename from path
    }
    // FIXME: else error?
};

Resource.prototype.data = function() {
    // If no data cached, read from file
    if (! this._data) {
        // FIXME: if no path?
        // FIXME: encoding?
        // FIXME: avoid sync?
        this._data = fs.readFileSync(this.path());
    }
    return this._data;
};

// TODO: copy existing resource, overriding properties
Resource.prototype.derive = function(properties) {
    properties = properties || {};
    return new Resource({
        // need to allow for 'null' to override
        path: properties.hasOwnProperty('path') ? properties.path : this.path,
        data: properties.hasOwnProperty('data') ? properties.data : this.data
    });
};

function filenameToResource(path) {
    return new Resource({path: path});
}




function Destination(path, forceDirectory) {
    this._path = path;
    if (forceDirectory || path.slice(-1) === '/') {
        this._isDirectory = true;
    }
    // TODO: check if file exists and correct type
}

Destination.prototype.path = function() {
    return this._path;
};

Destination.prototype.isDirectory = function() {
    return this._isDirectory;
};


function filenameToDestination(path, forceDirectory) {
    if (! (path instanceof Destination)) {
        if (typeof path !== 'string') {
            throw new Error('destination path is not a string: ' + path);
        }

        return new Destination(path, forceDirectory);
    } else {
        return path;
    }
}

function resolvePipeline(spec) {
    return spec.map(function(opName) {
        // TODO: also accept resolved, possibly configured, operation objects
        return luigi.operation(opName);
    });
}


function send(files, pipeline) {
    var operations = resolvePipeline(pipeline);

    // TODO: parallelize? flatten files if array? at what stage?
    return glob(files).then(function(filenames) {
        var resources = filenames.map(filenameToResource);
        return operations.reduce(function(res, op) {
            return res.then(op);
        }, q(resources));
    });
}

function to(resources, destPath) {
    var multipleResources = resources.length > 1;
    // TODO: if multipleResources, assume dir

    var dest = filenameToDestination(destPath, multipleResources);
    if (dest.isDirectory()) {
        var directory = dest.path();
        return q.all(resources.map(function(resource) {
            // FIXME: .filename() missing! must pass filename through ops
            return writeFile(directory + resource.filename(), resource.data()).then(function() {
                // TODO: return corresponding dest
            });
        }));
    } else {
        if (resources.length > 1) {
            throw new Error('cannot output multiple resources to a single file');
        }

        return q.all(resources.map(function(resource) {
            return writeFile(dest.path(), resource.data()).then(function() {
                return dest;
            });
        }));
    }
}


// Pass all JS files through pipeline
send('examples/*.js', ['uglify', 'concat']).then(function(resources) {
    // console.log("OUTPUT", resources)
    to(resources, 'out/out.js').then(function(dests) {
        dests.forEach(function(dest) {
            console.log("written to", dest.path());
        });
    });
});

// Copying is just an empty pipeline to a new file
send('examples/some.js', []).then(function(resources) {
    to(resources, 'out/some.copy.js').then(function(dests) {
        dests.forEach(function(dest) {
            console.log("written to", dest.path());
        });
    });
});

// Pass all JS files through pipeline
send('examples/amd.js', ['requirejs']).then(function(resources) {
    to(resources, 'out/amd.js').then(function(dests) {
        dests.forEach(function(dest) {
            console.log("written to", dest.path());
        });
    });
});

// TODO: Can use multiple file matchers
// send(['some.js'], ['uglify', 'concat']);


// TODO: allow outputing to dir, regardless of number of resources
// to(resources, 'dist/');
// to(resources, 'dist'); // exists as a dir
// to(resources, luigi.dir('dist'));
// to(resources, {javascript: 'app.js', sourcemap: 'app.js.map'});

// TODO: create target directory if missing

// TODO: DSL?
// luigi.as('compile').send(sources, compile).to(dest)


// TRY: js2-refactor

