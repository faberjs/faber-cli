#!/usr/bin/env node

import { program } from 'commander';
import { readFile } from 'fs/promises';
import {
	handleAddCommand,
	handleCreateCommand,
	handleListCommand,
	handleRemoveCommand,
	handleRunCommand,
} from './utils/commands.js';

const pkg = JSON.parse(await readFile(new URL('./package.json', import.meta.url)));

program
	.name('faber')
	.description('A CLI for creating projects from custom boilerplates.')
	.version(pkg.version, '-v, --version', 'Output the installed version of the CLI');

program
	.command('create')
	.arguments('<name>')
	/* .option('--dry', 'Simulate the actions without making any changes.') */
	/* .option(
		'--keep-git',
		'Prevent removal of the .git folder. Useful to check what has changed on the original boilerplate.'
	) */
	.option(
		'--use-existing',
		'If the folder already exists, skip the prompt and continue with the existing folder, without cloning the repository.'
	)
	.option(
		'--override-existing',
		'If the folder already exists, skip the prompt and deletes the existing folder before cloning the repository.'
	)
	.option(
		'--branch <string>',
		'Name of the git branch to retrieve from the repository. If not defined, uses the default branch.'
	)
	.description('Creates a new project with a configured boilerplate.')
	.action(handleCreateCommand);

program
	.command('run')
	/* .option('--dry', 'Simulate the actions without making any changes.') */
	.option('--data <string>', 'Encoded JSON data to be passed to the script')
	.option('--no-preview', 'Do not show the JSON data preview')
	.option('--deep-preview', 'Show the JSON data preview with all the properties and array items expanded')
	.option('--no-results', 'Do not show the actions results')
	.description('Run the script inside the current repository (usually for development)')
	.action(handleRunCommand);

program.command('ls').description('List your registered boilerplates.').action(handleListCommand);

const addArgs = '<alias> <repository> [name]';
program
	.command('add')
	.arguments(addArgs)
	.description('Adds a boilerplate to your list of available boilerplates.')
	.action(handleAddCommand);

program
	.command('rm <alias>')
	.description('Removes a boilerplate from your list of available boilerplates.')
	.action(handleRemoveCommand);

program.parse(process.argv);
