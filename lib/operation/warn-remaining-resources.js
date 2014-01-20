function warnRemainingResources(resources) {
    if (resources.length > 0) {
        console.log(resources.length + ' unprocessed resources:');
        resources.forEach(function(resource) {
            console.log(resource.filename());
        });
    }
}

module.exports = warnRemainingResources;
