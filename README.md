Plumber
=======

A Node-based tool for managing declarative web asset pipelines.

*This project is a functional proof-of-concept -- feedback welcome!*

## Example

The `Pipeline.js` file below describes two tasks:

- *compile*: Minifies all `*.js` files found in the `examples`
  directory and concatenates the result into a single `out/out.js` file.
- *stylesheets*: Compiles all LESS files into CSS and write
  them in the `out` directory.

```
var glob = require('./src/operation/glob');
var uglify = require('./src/operation/uglify')();
var concat = require('./src/operation/concat')();
var less = require('./src/operation/less')();
var write = require('./src/operation/write');

module.exports = function(pipelines) {

    // minify and concatenate all JS files
    var sources = 'examples/**/*.js';
    var dest = 'out/out.js';
    pipelines['compile'] = [glob(sources), uglify, concat, write(dest)];

    // compile all LESS files to CSS
    pipelines['stylesheets'] = [glob('examples/*.less'), less, write('out')];

};
```

Note: the syntax is still being defined and may change radically in
the future.

You can then run each individual task with `plumber <task>` or
all of them with `plumber`.


## Principles

- Avoid boilerplate, use sensible defaults
- Hide operation internals behind a standard interface
- Make it trivial to write new operations
- Support outputing auxiliary files (sourcemaps, hash mapping, etc)
- Treat single-run and watch as different executions of a same defined pipeline
- Aim for high performance (exploit parallelism, caching, dirty-checking)
- Rely on typing of files to assert applicability of operations
- Allow specification of input files from config or as CLI arguments
- Support building assets and running linting/tests in the same way


## Architecture

Most web asset building can be described as a pipeline of operations.
Each operation takes one or more files as input and returns one or
more files as output.  The output of an operation can be piped as
input to the next operation, creating a linear pipeline.  Typically,
source files are fed to the pipeline and the generated files are
written to a destination directory.

This model works for a variety of file types (JavaScript,
CoffeeScript, LESS, Sass, etc) and a variety of operations (minimize,
transpile, AMD compilation, concatenation, etc).  Linting and testing
can even be modeled as a pipeline, where the output is the result or
report.

An operation should only be concerned about doing a single thing well,
and it is asynchronous by default using Promises.  Performance
optimisation such as parallelism and caching are outside the scope of
operations; instead, they are the sole concern of Plumber.

File data is currently being passed as strings, rather than streams,
because most libraries that operations wrap do not support streams
natively anyway...


## Related projects

### [Grunt](http://gruntjs.com/)

The most popular task runner.  Tasks are completely independent and
executed imperatively.

### [Gulp](https://github.com/wearefractal/gulp) and [James](https://github.com/leonidas/james.js)

Both are stream-based pipelines of operations.  The main difference
with Plumber is the current lack of support for auxiliary files
(e.g. sourcemaps) and the treatment of watch as a special listener
which triggers a given block (e.g. re-run) on change.
