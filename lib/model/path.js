var identity = function(x){ return x; };


function Path(properties) {
    this._dirname = properties.dirname;
    if (properties.filename) {
        // normalize '' to undefined
        this._filename = properties.filename;
    }
}

Path.prototype.dirname = function() {
    return this._dirname;
};

Path.prototype.filename = function() {
    return this._filename;
};

Path.prototype.absolute = function() {
    return [this.dirname(), this._filename].filter(identity).join('/');
};

Path.prototype.isDirectory = function() {
    return ! this._filename;
};

Path.prototype.withFilename = function(filename) {
    return new Path({dirname: this.dirname(), filename: filename});
};

module.exports = Path;
