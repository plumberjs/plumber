
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
//   * Implement hash task, also output asset mapping
//   * Error if trying to write multiple files to single file
//   * Output sourcemap as extra resource
//   * Reuse Resource for Destination?
//   * Represent resource type, check as input, provide as output
//   * Allow specifying multiple destinations by type
//   * Use Harmony modules and other patterns (let, etc)?
//   * Break down files, add tests

// TODO: try implement:
//   - hash
//   - glue (or similar)
//   - jshint
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
        return new Resource({
            filename: resource.filename().replace('.js', '.min.js'),
            data: result.code
        });
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
                return [new Resource({
                    filename: resource.path(),
                    data: compiledData
                })];
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
            return new Resource({
                filename: resource.path().replace('.less', '.css'),
                data: cssData
            });
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
    this._filename = properties.filename ||
        (properties.path && extractFilename(properties.path));

    function extractFilename(path) {
        return path.split('/').slice(-1)[0];
    }
}

Resource.prototype.path = function() {
    return this._path;
};

Resource.prototype.filename = function() {
    return this._filename;
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

function filenameToResource(path) {
    return new Resource({path: path});
}




function Destination(properties) {
    properties = properties || {};
    this._path = properties.path;
    this._isDirectory = properties.isDirectory;
}

Destination.prototype.path = function() {
    return this._path;
};

Destination.prototype.isDirectory = function() {
    return this._isDirectory;
};

// TODO: copy existing destination, overriding properties
Destination.prototype.withFilename = function(filename) {
    return new Destination({
        path: [this.path(), filename].join('/'),
        isDirectory: this.isDirectory()
    });
};


function looksLikeDirectory(path) {
    // FIXME: terrible heuristic
    return path.slice(-1) === '/' || ! /\.(js|css|less)$/.test(path);
}

function filenameToDestination(path) {
    if (path instanceof Destination) {
        return path;
    } else {
        if (typeof path !== 'string') {
            throw new Error('destination path is not a string: ' + path);
        }

        // TODO: use async API
        var isDirectory;
        if (fs.existsSync(path)) {
            var stats = fs.statSync(path);
            isDirectory = stats.isDirectory();
        } else {
            isDirectory = looksLikeDirectory(path);
        }
        // FIXME: strip trailing / if any

        return new Destination({
            path: path,
            isDirectory: isDirectory
        });
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
    var dest = filenameToDestination(destPath);

    // Trying to output multiple resources into a single file? That won't do
    if (resources.length > 1 && ! dest.isDirectory()) {
        throw new Error('Cannot write multiple resources to a single file!');
    }

    return q.all(resources.map(function(resource) {
        var destFile;
        if (dest.isDirectory()) {
            destFile = dest.withFilename(resource.filename());
        } else {
            destFile = dest;
        }

        return writeFile(destFile.path(), resource.data()).then(function() {
            return destFile;
        });
    }));
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

// Minify all files and write to out directory
test('examples/*.js', ['uglify'], 'out');

// Minify all files and try to write to single file -- FAILS!
// FIXME: doesn't fail?
test('examples/*.js', ['uglify'], 'out/singlefile.js');

// Copying is just an empty pipeline to a new file
test('examples/some.js', [], 'out/some.copy.js');
test('examples/some.js', [], 'out');

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

