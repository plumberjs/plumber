Plumber
=======

A Node-based tool for managing declarative web asset pipelines.

To install plumber, use `npm` to install the `plumber-cli` module
(globally for ease of use):

```
$ sudo npm install -g plumber-cli
```

For an introduction, you may want to read the blog post [Abstracting away the grunt work with Plumber](http://bytes.inso.cc/2014/01/21/abstracting-away-the-grunt-work-with-plumber/).


## Example

```
var all       = require('plumber-all');
var glob      = require('plumber-glob');
var bower     = require('plumber-bower');
var requirejs = require('plumber-requirejs');
var uglifyjs  = require('plumber-uglifyjs')();
var hash      = require('plumber-hash')();
var concat    = require('plumber-concat');
var less      = require('plumber-less')();
var filter    = require('plumber-filter');
var write     = require('plumber-write');

module.exports = function(pipelines) {

    var sources = glob.within('src');
    var writeToDist = write('dist');

    var requireConfig = {
        paths: {
            'event-emitter': '../../eventEmitter/EventEmitter'
        },
        shim: {
            'event-emitter': {exports: 'EventEmitter'}
        }
    };

    // Compile all JavaScript
    pipelines['compile:js'] = [
        all(
            sources('js/require.conf.js'),
            [sources('js/modules/app.js'), requirejs(requireConfig)],
            bower('underscore'),
            bower('pikaday', 'pikaday.js')
        ),
        uglifyjs,
        hash,
        writeToDist
    ];

    // Compile stylesheets
    pipelines['compile:css'] = [
        all(
            sources('stylesheets/reset.css'),
            [sources('stylesheets/less/*.less'), less],
            [bower('pikaday'), filter.type('css')]
        ),
        concat('style'),
        writeToDist
    ];

};
```

The `Plumbing.js` file above defines two sample pipelines:

- *compile:js*: Take all of the RequireJS config file, the main AMD
   `app.js` file compiled by RequireJS, the file exported by the
   `underscore` Bower component and the `pikaday.js` file in the
   `pikaday` Bower component, minimise all the JavaScript, hash the
   filenames and write the resulting JavaScript, sourcemaps and asset
   mapping files in the `dist` directory.

- *compile:css*: Take all of the `reset.css` file, the LESS files
  compiled to CSS, and the CSS files exported by the `pikaday`
  Bower component, concatenate them all into a single file named
  `style.css` and write the result in the `dist` directory.

You can run each individual pipeline with `plumber <pipeline>` or
all of them with `plumber`.

*Note: the syntax is still being defined and may change in the
future.*


## Operations

### Sourcing

- [glob](https://github.com/plumberjs/plumber-glob): find files using a path or pattern
- [bower](https://github.com/plumberjs/plumber-bower): find files from a [Bower](http://bower.io/) component
- [lodash](https://github.com/plumberjs/plumber-lodash): generate a custom [Lo-Dash](http://lodash.com/) build

### Outputting

- [write](https://github.com/plumberjs/plumber-write): write the result into files or directories
- [s3](https://github.com/plumberjs/plumber-s3): write files to Amazon S3

### Compilation

- [requirejs](https://github.com/plumberjs/plumber-requirejs): compile an AMD module and its dependencies together
- [uglifyjs](https://github.com/plumberjs/plumber-uglifyjs): minimise JavaScript using [UglifyJS](http://lisperator.net/uglifyjs/)
- [less](https://github.com/plumberjs/plumber-less): compile [LESS](http://lesscss.org/) files to CSS
- [libsass](https://github.com/plumberjs/plumber-libsass): compile [Sass](http://sass-lang.com/) files to CSS
- [myth](https://github.com/plumberjs/plumber-myth): transform CSS files using the [Myth](http://www.myth.io/) preprocessor
- [mincss](https://github.com/plumberjs/plumber-mincss): minimise CSS (using LESS)
- [coffee](https://github.com/plumberjs/plumber-coffee): transpile CoffeeScript to JavaScript

### Transformation

- [rename](https://github.com/plumberjs/plumber-rename): rename the filename of the input
- [concat](https://github.com/plumberjs/plumber-concat): concatenate all the input together
- [filter](https://github.com/plumberjs/plumber-filter): filter the input (e.g. based on file type)
- [hash](https://github.com/plumberjs/plumber-hash): hash the filenames and generate a mapping

### Testing

- [jshint](https://github.com/plumberjs/plumber-jshint): run [JSHint](http://www.jshint.com/) on the input and produce a report

### Meta-operation

- [all](https://github.com/plumberjs/plumber-all): pass the input into the given set of operations and return the result



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
and it is asynchronous by default using [RxJS](https://github.com/Reactive-Extensions/RxJS).  Performance
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
