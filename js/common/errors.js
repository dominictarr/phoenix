exports.BadInput = function(details) { this.details = details; };
exports.BadInput.prototype = Object.create(Error.prototype);