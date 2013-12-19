var fs = require('fs');
var stringToPath = require('../util/string-to-path');

function Resource(properties) {
    properties = properties || {};

    // TODO: record filename, by default map to same filename
    this._path = properties.path && stringToPath(properties.path);
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
        this._data = fs.readFileSync(this.path().absolute(), 'utf-8');
    }
    return this._data;
};

module.exports = Resource;
