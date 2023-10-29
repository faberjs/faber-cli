import shell from 'shelljs';
import colors from 'colors';
// import jsonpack from 'jsonpack/main.js';
import { folderExists, getAbsolutePath } from './files.js';
import { addBoilerplate, getBoilerplates, getSettings, removeBoilerplate, updateBoilerplate } from './settings.js';
import { printActionResults, printBoilerplatesTable, printDataPreview, printMsg, printError } from './ui.js';
import { cloneRepository } from './repo.js';
import faber from './faber.js';
import { runActions } from './actions.js';
import { validateActions } from './actions.js';
import { parseJsonData } from './data.js';
import {
	askJsonData,
	askBoilerplateUpdateConfirmation,
	askBoilerplateChoice,
	askToProceedWithProvidedData,
	askActionWithExistingFolder,
} from './prompts.js';
import { existsSync } from 'fs';

/**
 * Handles the `run` command.
 * @param {object} options - The command options object.
 */
export async function handleRunCommand(options) {
	// Check if faberconfig file exists
	if (!existsSync(getAbsolutePath('faberconfig.js'))) {
		const pwd = shell.pwd();
		printError(`Fetching error`, `No faberconfig file found at ${colors.cyan(pwd)}.`);
		shell.exit(0);
	}

	// Imports the faberconfig file
	let config = null;
	try {
		config = await import(getAbsolutePath('faberconfig.js'));
	} catch (error) {
		printError('Parsing error', 'An error occurred while reading the faberconfig file.', error);
		shell.exit(0);
	}
	config.default(faber);

	// Get JSON data
	let data = null;
	if (options.data) {
		// --data
		data = parseJsonData(options.data);
		if (!data) {
			printMsg(
				`The provided data is not a valid encoded JSON string.` +
					`\n  Make sure the JSON is minified or encoded, and in one single line.`,
				'error'
			);
			console.error(error);
			shell.exit(0);
		}
	} else {
		const { json } = await askJsonData();
		data = parseJsonData(json);
	}

	// Print JSON data preview
	const hasData = data && typeof data === 'object' && Object.keys(data).length > 0;
	if (options.preview && data) {
		if (typeof data === 'object' && Object.keys(data).length === 0) {
			printMsg(`No data was provided.\n`, 'muted');
		} else {
			console.log('');
			printMsg(colors.bold(`Provided data:`) + colors.gray(` (you can use --no-preview to omit this)`), '', ' ');
			printDataPreview(data, options.deepPreview); // --deep-preview

			// Check if there are objects or arrays
			let hasObjectOrArray = false;
			Object.keys(data).forEach((key) => {
				if (typeof data[key] === 'object' && data[key] !== null) {
					hasObjectOrArray = true;
				}
			});
			hasObjectOrArray &&
				console.log(
					colors.gray(`(You can use the --deep-preview option for viweing objects and arrays details)\n`)
				);
		}
	}

	// Confirm to proceed with provided data
	const { proceedWithProvidedData } = await askToProceedWithProvidedData(hasData);
	if (!proceedWithProvidedData) {
		printMsg(`Operation cancelled\n`, 'muted');
		shell.exit(0);
	}

	// Run boilerplate actions
	let results = [];
	let actions = null;

	try {
		actions = faber.actions(data);
	} catch (error) {
		printError('Preparation error', 'An error occurred reading the actions.', error);
		shell.exit(0);
	}

	try {
		validateActions(actions);
	} catch (error) {
		printError('Validation error', 'There are invalid action settings or data.', error);
		shell.exit(0);
	}

	shell.exit(1);

	try {
		results = await runActions(actions);
	} catch (error) {
		printError('Execution error', 'An error occurred executing the actions.', error);
		shell.exit(0);
	}

	// Print results
	console.log('');
	printMsg(`Actions applied successfully.`, 'success', '✔');
	if (options.results && results.length) {
		console.log('');
		printMsg(colors.bold(`Results:`) + colors.gray(` (you can use --no-results to omit this)`), '', ' ');
		printActionResults(results);
	} else {
		printMsg(`There are no results to show.\n`, 'muted');
	}
}

/**
 * Handles the `create` command.
 * @param {string} name - The name of the new folder.
 * @param {object} options - The command options object.
 */
export async function handleCreateCommand(name, options) {
	try {
		// Check if git is installed
		if (!shell.which('git') && !(options.useExisting || options.overrideExisting)) {
			printMsg(`Sorry, this script requires git.`, 'error');
			printMsg(`Make sure you have git installed and available before running this command.`, '', ' ');
			shell.exit(1);
		}

		// Check if folder already exists
		if (folderExists(name) && !options.useExisting && !options.overrideExisting) {
			printMsg(`There is already a folder named \`*${name}*\` on this directory.`, 'warn');
			const { actionWithExistingFolder } = await askActionWithExistingFolder();

			switch (actionWithExistingFolder) {
				case 'cancel':
					printMsg(`Operation cancelled\n`, 'muted');
					shell.exit(0);

				case 'override':
					options.overrideExisting = true;
					break;

				case 'continue':
				default:
					options.useExisting = true;
					break;
			}
		}

		// Clone the repository
		if (!options.useExisting) {
			// Get registered boilerplates
			const boilerplates = await getBoilerplates();
			const { boilerplate } = await askBoilerplateChoice(boilerplates);

			if (options.overrideExisting) {
				shell.rm('-rf', name);
			}

			try {
				printMsg(`Cloning repository...`, 'info');
				await cloneRepository(boilerplate.repo, name, options.branch);
			} catch (err) {
				printError(`Cloning error`, `Unable to clone the repository.`, err);
			}
		}
	} catch (error) {
		console.error(error);
	}

	// Continue with the `run` command
	shell.cd(name);
	await handleRunCommand(options);
}

/**
 * Handles the `add` command.
 * @param {string} alias - The alias of the boilerplate.
 * @param {string} repo - The repository of the boilerplate.
 * @param {string} name - The name of the boilerplate.
 */
export async function handleAddCommand(alias, repo, name) {
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
}

/**
 * Handles the `rm` command.
 * @param {string} alias - The alias of the boilerplate.
 */
export async function handleRemoveCommand(alias) {
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
}

/**
 * Handles the `ls` command.
 */
export async function handleListCommand() {
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
}
