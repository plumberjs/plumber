// TODO: move into CLI?

var operation = require('../core').operation;
var Resource  = require('../model/resource');
var Rx        = require('rx');

function warnRemainingResources() {
    // TODO: cleaner filter of resource vs report on stream?
    return operation(function(resourcesOrReportsStream) {
        return resourcesOrReportsStream.toArray().flatMap(function(resourcesOrReports) {
            var resources = resourcesOrReports.filter(Resource.isResource);
            if (resources.length > 0) {
                console.error(resources.length + ' unprocessed resources:');
                resources.forEach(function(resource) {
                    console.error(resource.filename());
                });
            }
            // TODO: We re-create the stream. Can we re-use the original? Why
            // not?
            return Rx.Observable.fromArray(resourcesOrReports);
        });
    });
}

module.exports = warnRemainingResources;
