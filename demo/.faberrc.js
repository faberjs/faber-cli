module.exports = {
	// COMPONENT task
	component: {
		description: 'Generate component boilerplate files',
		args: ['name', 'path?'],
		files: [
			{
				template: './.faber/templates/component-js',
				output: './Components/component/index.js',
				compiler: 'twig',
			},
			{
				template: './.faber/templates/component-js',
				output: './Components/component/style.css',
				compiler: 'twig',
			},
		],
		questions: [
			{
				type: 'input',
				name: 'path',
				message: 'Informe o path',
			},
		],
		filter: (context) => {
			const name = context.name;
			context.name = {
				kebab: name + '--kebab',
				pascal: name + '--pascal',
				snake: name + '--snake',
				camel: name + '--camel',
			};
			return context;
		},
		compilers: ['bracket', 'twig'],
	},

	// PAGE task
	page: {
		description: 'Generate page boilerplate files',
	},
};
