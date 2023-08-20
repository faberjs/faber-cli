#!/usr/bin/env node

import { program } from 'commander';
import { readFile } from 'fs/promises';
import shell from 'shelljs';
// import jsonpack from 'jsonpack/main.js';
import { folderExists, getRelativePath } from './utils/files.js';
import {
	addBoilerplate,
	getBoilerplates,
	getSettings,
	removeBoilerplate,
	updateBoilerplate,
} from './utils/settings.js';
import { printBoilerplatesTable, printMsg } from './utils/ui.js';
import { cloneRepository } from './utils/repo.js';
import faber from './utils/faber.js';
import { runActions } from './utils/actions.js';
import { parseJsonData } from './utils/data.js';
import {
	askJsonData,
	askBoilerplateUpdateConfirmation,
	askBoilerplateChoice,
	askToContinueWithExistingFolder,
} from './utils/prompts.js';

const pkg = JSON.parse(await readFile(new URL('./package.json', import.meta.url)));

program
	.name('faber')
	.description('A CLI for creating projects from custom boilerplates.')
	.version(pkg.version, '-v, --version', 'Output the installed version of the CLI');

program
	.command('create')
	.arguments('<name>')
	.option('--dry', 'Simulate the actions without making any changes.')
	.option(
		'--keep-git',
		'Prevent removal of the .git folder. Useful to check what has changed on the original boilerplate.'
	)
	.option('--use-existing', 'Skip the prompt to use existing folder.  Useful when working on a boilerplate.')
	.description('Creates a new project with a configured boilerplate.')
	.action(async (name, options) => {
		try {
			// Check if git is installed
			if (!shell.which('git') && !options.useExisting) {
				printMsg(`Sorry, this script requires git.`, 'error');
				printMsg(`Make sure you have git installed and available before running this command.`, '', ' ');
				shell.exit(1);
			}

			// Check if folder already exists
			if (folderExists(name) && !options.useExisting) {
				printMsg(`There is already a folder named \`*${name}*\` on this directory.`, 'warn');
				const { proceedWithExistingFolder } = askToContinueWithExistingFolder();

				if (!proceedWithExistingFolder) {
					printMsg(`Operation cancelled`, 'muted');
					shell.exit(0);
				}
			}

			// Get registered boilerplates
			const boilerplates = await getBoilerplates();
			const { boilerplate } = askBoilerplateChoice(boilerplates);

			try {
				// const repoDetails = gitUrlParse('https://gitlab.com/gpc-dev/desenrolla');
				// repoDetails.git_suffix = true;
				// repoDetails.filepath = 'README.md';
				// console.log(repoDetails.toString());
				await cloneRepository(boilerplate.repo, name);
			} catch (err) {
				console.log(err);
				printMsg(
					`Sorry, it seems that a problem occurred during the process. See the logs above for more details.`,
					'error'
				);
			}
		} catch (error) {
			console.error(error);
		}
	});

program
	.command('execute')
	.option('--dry', 'Simulate the actions without making any changes.')
	.option('--data <string>', 'Encoded JSON data to be passed to the script')
	.option('--no-preview', 'Do not show the JSON data preview')
	.description('Run the script inside the current repository (usually for development)')
	.action(async (options) => {
		const config = await import(getRelativePath('faberconfig.js'));
		config.default(faber);

		// Get project data
		/* const testData = {
			projectName: 'Greenpark',
			clientName: 'Unilever',
			projectUrl: 'https://greenpark.digital/',
			isMultisite: true,
		};
		const jsonStr = JSON.stringify(testData, null);
		const compressed = jsonpack.pack(jsonStr);
		const bytes = Buffer.from(compressed).length; */

		// Get JSON data
		let data;
		if (options.data) {
			data = parseJsonData(options.data);
			if (!data) {
				printMsg(
					`The provided data is not a valid encoded JSON string.` +
						`\n  Make sure the JSON is minified or encoded, and in one single line.`,
					'error'
				);
				console.error(error);
				process.exit(1);
			}
		} else {
			const { json } = await askJsonData();
			data = parseJsonData(json);
		}

		// Run boilerplate actions
		const results = await runActions(faber.actions(data));
		console.log(results);
	});

program
	.command('ls')
	.description('List your registered boilerplates.')
	.action(async () => {
		try {
			const boilerplates = await getBoilerplates();
			if (!boilerplates.length) {
				printMsg('There are no boilerplates to list\n', 'error');
				printMsg(`You can add a boilerplate with: faber add ${addArgs}\n`, 'info');
				return;
			}

			printBoilerplatesTable(boilerplates);
		} catch (error) {
			console.error(error);
		}
	});

const addArgs = '<alias> <repository> [name]';
program
	.command('add')
	.arguments(addArgs)
	.description('Adds a boilerplate to your list of available boilerplates.')
	.action(async (alias, repo, name) => {
		try {
			const settings = await getSettings();

			if (!settings.hasOwnProperty('boilerplates')) {
				settings.boilerplates = [data];
				return;
			}

			const data = { alias, repo, name: name ? name : '' };

			const existingBoilerplate = settings.boilerplates.find((b) => b.alias === alias);
			if (existingBoilerplate) {
				printMsg(`A boilerplate with alias *${alias}* already exists:`, 'error');
				printBoilerplatesTable([existingBoilerplate]);

				const { shouldUpdate } = askBoilerplateUpdateConfirmation();

				shouldUpdate && (await updateBoilerplate(alias, data));
				return;
			}

			await addBoilerplate(data);
		} catch (error) {
			console.error(error);
		}
	});

program
	.command('rm <alias>')
	.description('Removes a boilerplate from your list of available boilerplates.')
	.action(async (alias) => {
		try {
			const settings = await getSettings();

			if (!settings.hasOwnProperty('boilerplates')) {
				printMsg(`There are no boilerplates configured`, 'error');
				return;
			}

			if (!settings.boilerplates.find((b) => b.alias === alias)) {
				printMsg(`No boilerplate found with alias *${alias}*`, 'error');
				return;
			}

			removeBoilerplate(alias);
		} catch (error) {
			console.error(error);
		}
	});

program.parse(process.argv);
