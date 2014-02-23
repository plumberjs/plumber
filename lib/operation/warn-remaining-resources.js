function warnRemainingResources(resources) {
    if (resources.length > 0) {
        console.error(resources.length + ' unprocessed resources:');
        resources.forEach(function(resource) {
            console.error(resource.filename());
        });
    }
}

module.exports = warnRemainingResources;
