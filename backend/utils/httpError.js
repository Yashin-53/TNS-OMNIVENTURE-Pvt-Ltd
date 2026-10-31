// Usage: throw httpError(404, 'Property not found');
module.exports = (status, message) => Object.assign(new Error(message), { status });
