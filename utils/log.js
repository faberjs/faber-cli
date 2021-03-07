const colors = require('colors');

module.exports = function (message = '') {
	console.log(`[${colors.gray('Faber')}] ${message}`);
};
