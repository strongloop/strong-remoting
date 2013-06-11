// This example shows using the helper for a type in a "definitive" fashion.
var helper = require('../../../').extend(module.exports);

/**
 * A simple class that contains a name, this time with a custom HTTP contract.
 */
helper.type(ContractClass, {
  accepts: [{ arg: 'name', type: 'string' }],
  http: { path: '/:name' }
});
function ContractClass(name) {
  this.name = name;
}

/**
 * Returns the ContractClass instance's name.
 */
helper.method(getName, {
  path: 'ContractClass.prototype.getName',
  returns: 'string'
});
function getName(callback) {
  callback(null, this.name);
}

/**
 * Takes in a name, returning a greeting for that name.
 */
helper.method(greet, {
  path: 'ContractClass.prototype.greet',
  accepts: [{ arg: 'other', type: 'string' }],
  returns: 'string'
});
function greet(other, callback) {
  callback(null, 'Hi, ' + other + '!');
}

/**
 * Returns the ContractClass prototype's favorite person's name.
 */
helper.method(getFavoritePerson, {
  path: 'ContractClass.getFavoritePerson',
  returns: 'string'
});
function getFavoritePerson(callback) {
  callback(null, 'You');
}
