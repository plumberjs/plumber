var Path = require('../model/path');
var fs = require('fs');

function stringToPath(path) {
    var segments = path.split('/');

    // TODO: use async API
    // TOOD: Better heuristic for non-existing files? Or require that the
    // `isDirectory` flag is manually set?
    var isDirectory = false;
    if (fs.existsSync(path)) {
        var stats = fs.statSync(path);
        isDirectory = stats.isDirectory();
    }

    if (isDirectory) {
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

module.exports = stringToPath;
