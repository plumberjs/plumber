/* Append the resources returned by func to those received as input */
function appendResources(func) {
    return function(inResources, supervisor) {
        return func(supervisor).then(function(outResources) {
            return inResources.concat(outResources);
        });
    };
}

module.exports = appendResources;
