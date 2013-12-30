var fs = require('fs');
var extend = require('extend');

var stringToPath = require('../util/string-to-path');

function Resource(properties) {
    properties = properties || {};

    // TODO: record filename, by default map to same filename
    this._path = properties.path && stringToPath(properties.path);
    this._data = properties.data;

    // Save filename as structure fragments
    var filename = properties.filename ||
        (properties.path && extractFilename(properties.path));

    this._file_name = properties.file_name ||
        (filename && filename.split('.').slice(0, -1).join('.'));
    this._file_trns = properties.file_trns || [];
    this._file_exts = properties.file_exts ||
        (filename && filename.split('.').slice(-1));

    this._transformations = [];

    function extractFilename(path) {
        return path.split('/').slice(-1)[0];
    }
}

Resource.prototype.path = function() {
    return this._path;
};

Resource.prototype.filename = function() {
    return [this._file_name].concat(this._file_trns, this._file_exts).join('.');
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



Resource.prototype.copy = function(override) {
    var properties = {
        // FIXME: forward path or not? (needed for rename only?)
        path:     this._path && this._path.absolute(),
        data:     this._data,
        file_name: this._file_name,
        file_trns: this._file_trns,
        file_exts: this._file_exts,
        transformations: this._transformations
    };
    return new Resource(extend(properties, override));
};
Resource.prototype.withTransformation = function(name, filenameComponent) {
    var ext = filenameComponent || name;
    return this.copy({
        file_trns: this._file_trns.concat(ext),
        transformations: this._transformations.concat(name)
    });
};
Resource.prototype.withExtension = function(suffix) {
    return this.copy({file_exts: this._file_exts.concat(suffix)});
};
Resource.prototype.replaceExtension = function(ext) {
    return this.copy({file_exts: [ext]});
};
Resource.prototype.withData = function(data) {
    return this.copy({data: data});
};


module.exports = Resource;
