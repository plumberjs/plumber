
// TODO: standardise model (errors, etc)
function Report(params) {
    this.writtenResource = params.resource;
    this.path    = params.path;
    this.type    = params.type;
    this.success = 'success' in params ? params.success : true;
    this.errors  = params.errors || [];
}


Report.isReport = function(obj) {
    // Use annotation on object as instanceof isn't reliable in NodeJS
    // (constructors from different versions)
    return typeof obj === 'object' && obj !== null && !! obj.__PlumberReport__;
};

Report.prototype.__PlumberReport__ = true;



module.exports = Report;
