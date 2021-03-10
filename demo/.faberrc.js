module.exports = {
	tasks: {
		// COMPONENT task
		component: {
			description: 'Generate component boilerplate files',
			args: {
				name: true, // true for required
				path: false,
			},
			options: {
				override: ['o', 'force'], // optional aliases
				description: null,
			},
			files: [
				{
					template: './.faber/templates/component-js',
					output: './Components/component/index.js',
					templateEngine: 'twig',
				},
				{
					template: './.faber/templates/component-css',
					output: './assets/css/{name}.css',
					templateEngine: 'handlebars',
				},
			],
			updates: [
				{
					template: './.faber/templates/component-js',
					output: './Components/component/index.js',
					templateEngine: 'twig',
				},
			],
			questions: [
				{
					type: 'input',
					name: 'path',
					message: 'Informe o path',
				},
			],
			filterData: (data) => {
				const name = data.name;
				data.name = {
					kebab: name + '--kebab',
					pascal: name + '--pascal',
					snake: name + '--snake',
					camel: name + '--camel',
				};

				if (!data.description) {
					data.description = 'TODO: Define description';
				}

				return data;
			},
			templateEngines: ['twig', 'handlebars'],
		},

		// PAGE task
		page: {
			description: 'Generate page boilerplate files',
		},
	},
};
