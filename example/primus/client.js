const remoting = require('../../');
const Primus = require('../../lib/primus-client');

const primus = new Primus({
  url: 'http://localhost:9000',
});

primus.send('invoke', {
  methodString: 'user.prototype.greet',
  args: {name: 'John'},
}, function(err, data) {
  console.log('err', err);
  console.log('data', data);
});
