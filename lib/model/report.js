
// TODO: standardise model (errors, etc)
function Report(params) {
    this.writtenResource = params.resource;
    this.path    = params.path;
    this.type    = params.type;
    this.success = 'success' in params ? params.success : true;
    this.errors  = params.errors || [];
}

module.exports = Report;
