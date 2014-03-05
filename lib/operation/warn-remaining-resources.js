// TODO: move into CLI?

var operation = require('../core').operation;
var Resource  = require('../model/resource');

function warnRemainingResources() {
    // TODO: cleaner filter of resource vs report on stream?
    return operation(function(resourcesOrReportStream) {
        return resourcesOrReportStream.collect().map(function(resourcesOrReport) {
            var resources = resourcesOrReport.filter(Resource.isResource);
            if (resources.length > 0) {
                console.error(resources.length + ' unprocessed resources:');
                resources.forEach(function(resource) {
                    console.error(resource.filename());
                });
            }
            return resourcesOrReport;
        });
    });
}

module.exports = warnRemainingResources;
