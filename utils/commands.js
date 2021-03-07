module.exports = {
	// VERSION command
	version: {
		description: 'Print the global and local faber versions.',
		action: (config) => {
			console.log(config.description);
		},
	},

	// HELP command
	help: {
		description: 'Show this help info.',
		action: (config) => {
			console.log(config.description);
		},
	},

	// TEST command
	test: {
		description: 'Testing commands, args and options',
		args: '<name> [optional]',
		options: {
			env: null,
			development: ['d', 'dev'],
		},
		action: (config) => {
			console.log(config.description);
		},
	},
};
