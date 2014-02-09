var extend = require('extend');

var stringToPath = require('../util/string-to-path');

/**
 * Represent a Resource (typically, a file)
 *
 * @param {String} path The absolute or relative path to the resource
 * @param {String} type The type of resource (javascript, css, etc)
 * @param {String} data The contents of the resource
 * @param {String} filename The filename of the resource
 * @param {String} file_name
 * @param {String} file_trns
 */
function Resource(properties) {
    properties = properties || {};

    // TODO: record filename, by default map to same filename
    this._path = properties.path && stringToPath(properties.path);
    this._type = properties.type;
    this._data = properties.data;
    this._sourceMap = properties.sourceMap;

    // Save filename as structure fragments
    var filename = properties.filename ||
        (properties.path && extractFilename(properties.path));

    this._file_name = properties.file_name ||
        (filename && filename.split('.').slice(0, -1).join('.'));
    this._file_trns = properties.file_trns || [];

    this._transformations = [];

    function extractFilename(path) {
        return path.split('/').slice(-1)[0];
    }
}

Resource.prototype.path = function() {
    return this._path;
};

Resource.prototype.type = function() {
    return this._type;
};

Resource.prototype.filename = function() {
    return [this._file_name].concat(this._file_trns, this.extension()).join('.');
};

Resource.prototype.extension = function() {
    // FIXME: join up with supervisor list
    return {
        javascript: 'js',
        css:  'css',
        less: 'less',
        html: 'html',
        json: 'json'
    }[this._type];
};

Resource.prototype.sourceMapFilename = function() {
    return this.filename() + '.map';
};

Resource.prototype.data = function() {
    return this._data;
};

Resource.prototype.sourceMap = function() {
    var sourceMap = this._sourceMap;
    if (sourceMap) {
        // Use current filename as 'file' property
        return sourceMap.withFile(this.filename());
    }
};



Resource.prototype.copy = function(override) {
    var properties = {
        // FIXME: forward path or not? (needed for rename only?)
        path:     this._path && this._path.absolute(),
        data:     this._data,
        sourceMap:this._sourceMap,
        type:     this._type,
        file_name: this._file_name,
        file_trns: this._file_trns,
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
Resource.prototype.withFileName = function(name) {
    return this.copy({file_name: name});
};
Resource.prototype.withType = function(type) {
    return this.copy({type: type});
};
Resource.prototype.withData = function(data, sourceMap) {
    return this.copy({data: data, sourceMap: sourceMap});
};
Resource.prototype.withSourceMap = function(sourceMap) {
    return this.copy({sourceMap: sourceMap});
};
Resource.prototype.withoutSourceMap = function() {
    return this.copy({sourceMap: undefined});
};


module.exports = Resource;
