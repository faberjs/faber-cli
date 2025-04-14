import {
	handleAddCommand,
	handleCreateCommand,
	handleExecCommand,
	handleListCommand,
	handleRemoveCommand,
} from './commands.js';

export const Commands = [
	{
		name: 'create',
		description: 'Create a new project with a configured boilerplate.',
		args: [
			{
				name: 'name',
				description: "Name of the project's root folder.",
				type: 'string',
				required: true,
			},
			{
				name: 'clone_url',
				description:
					'The URL for cloning the repository (can be SSL or HTTPS, depending on your permissions and authentication).',
				type: 'string',
				required: false,
			},
		],
		options: [
			{
				name: 'use-existing',
				description:
					'If the folder already exists, skip the prompt and continue with the existing folder, without cloning any repository.',
				type: 'boolean',
				default: false,
			},
			{
				name: 'override-existing',
				description:
					'If the folder already exists, skip the prompt and delete the existing folder before cloning the repository.',
				type: 'boolean',
				default: false,
			},
			{
				name: 'branch',
				description:
					'Name of the git branch to retrieve from the repository. If not defined, the default branch is used.',
				type: 'string',
			},
			{
				name: 'keep-git',
				description:
					'Prevent deleting the existing Git history from the new cloned folder, removed by default.',
				type: 'boolean',
			},
			{
				name: 'keep-config',
				description:
					'Prevent deleting the `faberconfig` file from the new cloned folder, removed by default.',
				type: 'boolean',
			},
		],
		handler: handleCreateCommand,
	},
	{
		name: 'execute',
		description:
			'Execute the configured actions on the current directory. Useful for configuring and testing actions.',
		args: [],
		options: [
			{
				name: 'data',
				description:
					'JSON data (preferrably encoded) to be passed to the actions.',
				type: 'string',
			},
			{
				name: 'no-preview',
				description: 'Does not show the JSON data preview.',
				type: 'boolean',
				default: false,
			},
			{
				name: 'deep-preview',
				description:
					'Shows the JSON data preview with all the properties and array items expanded.',
				type: 'boolean',
				default: false,
			},
			{
				name: 'no-results',
				description: 'Does not show the actions results.',
				type: 'boolean',
				default: false,
			},
		],
		handler: handleExecCommand,
	},
	{
		name: 'ls',
		description: 'List your registered boilerplates.',
		args: [],
		options: [],
		handler: handleListCommand,
	},
	{
		name: 'add',
		description: 'Adds a boilerplate to your list of available boilerplates.',
		args: [
			{
				name: 'alias',
				description:
					'Boilerplate alias, used to reference this repository on other commands. It should consist only of letters, numbers, dashes and underscores.',
				type: 'string',
				required: true,
			},
			{
				name: 'clone_url',
				description:
					'URL to clone the repository. It usually ends with `.git`',
				type: 'string',
				required: true,
			},
			{
				name: 'name',
				description:
					'Name of the boilerplate, displayed on boilerplate selection.',
				type: 'string',
				required: false,
			},
		],
		options: [],
		handler: handleAddCommand,
	},
	{
		name: 'rm',
		description:
			'Remove a boilerplate from your list of available boilerplates.',
		args: [
			{
				name: 'alias',
				description: 'Alias of the boilerplate to be removed.',
				type: 'string',
				required: true,
			},
		],
		options: [],
		handler: handleRemoveCommand,
	},
];
