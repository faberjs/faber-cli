#!/usr/bin/env node

import { program } from 'commander';
import { readFile } from 'fs/promises';
import inquirer from 'inquirer';
import shell from 'shelljs';
import { folderExists } from './utils/files.js';

import { addBoilerplate, getBoilerplates, getConfig, removeBoilerplate, updateBoilerplate } from './utils/settings.js';
import { printBoilerplatesTable, printMsg } from './utils/ui.js';

const pkg = JSON.parse(await readFile(new URL('./package.json', import.meta.url)));

const options = program.opts();

program
	.name('faber')
	.description('A CLI for creating projects from custom boilerplates.')
	.version(pkg.version, '-v, --version', 'Output the installed version of the CLI');

program
	.command('create')
	.arguments('<name>')
	.option('--simulate', 'Log the possible changes without modifying any file.')
	.option(
		'--keep-git',
		'Prevent removal of the .git folder. Useful to check what has changed on the original boilerplate.'
	)
	.option('--use-existing', 'Skip the prompt to use existing folder. Useful when developing')
	.description('Create a new project with a configured boilerplate.')
	.action(async (name, options) => {
		try {
			if (!shell.which('git') && !options.useExisting) {
				printMsg(`Sorry, this script requires git.`, 'error');
				printMsg(`Make sure you have git installed and available before running this command.`, '', ' ');
				shell.exit(1);
			}

			if (folderExists(name) && !options.useExisting) {
				printMsg(`There is already a folder named \`*${name}*\` on this directory.`, 'warn');
				const { proceedWithExistingFolder } = await inquirer.prompt({
					type: 'confirm',
					name: 'proceedWithExistingFolder',
					message: `Do you want to continue with this folder?`,
					suffix: ` (git clone will be skipped)`,
					default: false,
				});

				if (!proceedWithExistingFolder) {
					printMsg(`Operation cancelled`, 'muted');
					shell.exit(0);
				}
			}
		} catch (error) {
			console.error(error);
		}
	});

const addArgs = '<boilerplate> <repository> [name]';
program
	.command('add')
	.arguments(addArgs)
	.description('Add a boilerplate repository to your list of available boilerplates.')
	.action(async (alias, repo, name) => {
		try {
			const settings = await getConfig();

			if (!settings.hasOwnProperty('boilerplates')) {
				settings.boilerplates = [data];
				return;
			}

			const data = { alias, repo, name: name ? name : '' };

			const existingBoilerplate = settings.boilerplates.find((b) => b.alias === alias);
			if (existingBoilerplate) {
				printMsg(`A boilerplate with alias *${alias}* already exists:`, 'error');
				printBoilerplatesTable([existingBoilerplate]);

				const { shouldUpdate } = await inquirer.prompt([
					{
						type: 'confirm',
						name: 'shouldUpdate',
						message: 'Do you want to update this boilerplate?',
						default: false,
					},
				]);

				shouldUpdate && (await updateBoilerplate(alias, data));
				return;
			}

			await addBoilerplate(data);
		} catch (error) {
			console.error(error);
		}
	});

program
	.command('ls')
	.description('List all configured boilerplates.')
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

program
	.command('rm <boilerplate>')
	.description('Remove a configured boilerplate.')
	.action(async (alias) => {
		try {
			const settings = await getConfig();

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

program.parse();
