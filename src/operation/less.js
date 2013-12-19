var Resource = require('../model/resource');

var q = require('q');
var less = require('less');

var render = q.denodeify(less.render);


module.exports = function(/* no options */) {
    return function(resources) {
        return q.all(resources.map(function(resource) {
            // TODO: extra options (filename, paths, yuicompress, etc)?
            return render(resource.data()).then(function(cssData) {
                return new Resource({
                    filename: resource.path().filename().replace('.less', '.css'),
                  data: cssData
                });
            });
        }));
    };
};
