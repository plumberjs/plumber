
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

    __operations: {}
};


// TODO:
//   * Reuse Path in Resource
//   * Break down files, add tests
//   * Represent resource type, check as input, provide as output
//   * Allow specifying multiple destinations by type
//   * Use Harmony modules and other patterns (let, etc)?

// TODO: try implement:
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

    return flatten(resources.map(function(resource) {
        // TODO: filename, based on output spec? on input filename?
        var minFilename = resource.filename().replace('.js', '.min.js');
        var sourceMapFilename = minFilename + '.map';

        var sourceMapData = UglifyJS.SourceMap();
        var result = UglifyJS.minify(resource.path(), {
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


luigi.define('hash', function(resources) {
    var crypto = require('crypto');

    function hash(data) {
        var md5sum = crypto.createHash('md5');
        md5sum.update(data, 'utf-8');

        var d = md5sum.digest('hex');
        return d.substr(0, 8);
    }

    var mapping = {};
    var hashedResources = resources.map(function(resource) {
        var hashKey = hash(resource.data());
        var hashedResource = new Resource({
            filename: resource.filename().replace(/(\.[^.]+)$/, ['.', hashKey, '$1'].join('')),
            data:     resource.data()
        });
        mapping[resource.filename()] = hashedResource.filename();
        return hashedResource;
    });

    var mappingResource = new Resource({
        filename: 'assets-mapping.json',
        data:     JSON.stringify(mapping)
    });

    return hashedResources.concat(mappingResource);
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


function Path(properties) {
    this._dirname = properties.dirname;
    if (properties.filename) {
        // normalize '' to undefined
        this._filename = properties.filename;
    }
}

Path.prototype.dirname = function() {
    return this._dirname;
}

Path.prototype.filename = function() {
    return this._filename;
}

Path.prototype.path = function() {
    return [this.dirname(), this._filename].filter(function(x){ return x; }).join('/');
}

Path.prototype.isDirectory = function() {
    return ! this._filename;
}

Path.prototype.withFilename = function(filename) {
    return new Path({dirname: this.dirname(), filename: filename});
}


function stringToPath(path) {
    var segments = path.split('/');
    // FIXME: check if last segment looks like filename, or if trailing /, or check on disk?
//     if (typeof this._isDirectory === 'undefined') {
//         // TODO: use async API
//         var path = this.path();
//         if (fs.existsSync(path)) {
//             var stats = fs.statSync(path);
//             this._isDirectory = stats.isDirectory();
//         } else {
//             // FIXME: terrible heuristic
//             this._isDirectory = path.indexOf('.') === -1;
//         }
//     }


    if (segments.slice(-1)[0].indexOf('.') === -1) {
        return new Path({
            dirname:  segments.join('/')
        });
    } else {
        return new Path({
            dirname:  segments.slice(0, -1).join('/'),
            filename: segments.slice(-1)[0]
        });
    }
}



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

function to(resources, dest) {
    var destPath = stringToPath(dest);

    // Trying to output multiple resources into a single file? That won't do
    if (resources.length > 1 && ! destPath.isDirectory()) {
        return q.reject(new Error('Cannot write multiple resources to a single file: ' + dest.path()));
    }

    return q.all(resources.map(function(resource) {
        var destFile;
        if (destPath.isDirectory()) {
            destFile = destPath.withFilename(resource.filename());
        } else {
            destFile = destPath;
        }

        return writeFile(destFile.path(), resource.data()).thenResolve(destFile);
    }));
}



// == Test luigi with some examples ==

function test(files, pipeline, dest) {
    send(files, pipeline).then(function(resources) {
        return to(resources, dest).then(function(dests) {
            dests.forEach(function(dest) {
                console.log("written to", dest.path());
            });
        }, function(err) {
            // FIXME: why not caught by parent errback?
            console.log("Writing failed: ", err);
        });
    }, function(err) {
        console.log("Sending failed: ", err);
    });
}


// Pass all JS files through pipeline
test('examples/*.js', ['uglify', 'concat'], 'out/out.js');

// Minify all files and write to out directory
test('examples/*.js', ['uglify'], 'out');

// Minify all files and try to write to single file -- FAILS!
test('examples/*.js', ['uglify'], 'out/singlefile.js');

// Copying is just an empty pipeline to a new file
test('examples/some.js', [], 'out/some.copy.js');
test('examples/some.js', [], 'out');

// Pass all JS files through pipeline
test(['examples/amd.js'], ['requirejs'], 'out/amd.js');

// Hash all files and write renamed version and mapping
test('examples/*.js', ['hash'], 'out');

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

