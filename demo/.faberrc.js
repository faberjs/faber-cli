module.exports = {
	tasks: {
		// COMPONENT task
		component: {
			description: 'Generate component boilerplate files',
			args: { name: true, path: false },
			options: [],
			files: [
				{
					template: './.faber/templates/component-js',
					output: './Components/component/index.js',
					templateEngine: 'twig',
				},
				{
					template: './.faber/templates/component-js',
					output: './Components/outro/index.js',
					templateEngine: 'twig',
				},
				{
					template: './.faber/templates/component-css',
					output: './assets/css/style.css',
					templateEngine: 'handlebars',
				},
			],
			questions: [
				{
					type: 'input',
					name: 'path',
					message: 'Informe o path',
				},
			],
			filterContext: (context) => {
				const name = context.name;
				context.name = {
					kebab: name + '--kebab',
					pascal: name + '--pascal',
					snake: name + '--snake',
					camel: name + '--camel',
				};
				return context;
			},
			templateEngines: ['twig', 'handlebars'],
		},

		// PAGE task
		page: {
			description: 'Generate page boilerplate files',
		},
	},
};
