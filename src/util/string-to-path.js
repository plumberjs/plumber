var Path = require('../model/path');

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

module.exports = stringToPath;
