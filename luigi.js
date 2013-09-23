
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


// TODO:
//   * Reuse Resource for Destination?
//   * Support directory Destination (Resource?), errors if mismatch
//   * Track Resource filename, inherit by default, can override via dest
//   * Operations can alter filename, e.g. append .min

// TODO: try implement:
//   - hash
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
                return readFile(tmpFile, 'utf-8');
            }).then(function(compiledData) {
                // Cleanup temporary file
                unlink(tmpFile);

                // and return generated data as a resource
                return [resource.derive({data: compiledData})];
            });
        }
    }
});


luigi.define('less', function(resources) {
    var less = require('less');
    var render = q.denodeify(less.render);

    return q.all(resources.map(function(resource) {
        // TODO: extra options (filename, paths, yuicompress, etc)?
        return render(resource.data()).then(function(cssData) {
            return resource.derive({data: cssData});
        });
    }));
});




var fs = require('fs');
var q = require('q');
var flatten = require('flatten');

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
        // FIXME: don't hardcode encoding?
        // FIXME: avoid sync?
        this._data = fs.readFileSync(this.path(), 'utf-8');
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


function glob(patterns) {
    var glob = q.denodeify(require('glob'));
    return q.all(patterns.map(function(patterns) {
        return glob(patterns);
    })).then(flatten);
}

function send(files, pipeline) {
    var patterns = (files instanceof Array) ? files : [files];
    var operations = resolvePipeline(pipeline);

    return glob(patterns).then(function(filenames) {
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



// == Test luigi with some examples ==

function test(files, pipeline, dest) {
    send(files, pipeline).then(function(resources) {
        to(resources, dest).then(function(dests) {
            dests.forEach(function(dest) {
                console.log("written to", dest.path());
            });
        });
    }, function(err) {
        console.log("Test failed: ", err);
    });
}

// Pass all JS files through pipeline
test('examples/*.js', ['uglify', 'concat'], 'out/out.js');

// Copying is just an empty pipeline to a new file
test('examples/some.js', [], 'out/some.copy.js');

// Pass all JS files through pipeline
test(['examples/amd.js'], ['requirejs'], 'out/amd.js');

// Pass LESS files to less
test('examples/*.less', ['less'], 'out/more.css');


// TODO: allow outputing to dir, regardless of number of resources
// to(resources, 'dist/');
// to(resources, 'dist'); // exists as a dir
// to(resources, luigi.dir('dist'));
// to(resources, {javascript: 'app.js', sourcemap: 'app.js.map'});

// TODO: create target directory if missing

// TODO: DSL?
// luigi.as('compile').send(sources, compile).to(dest)


// TRY: js2-refactor

