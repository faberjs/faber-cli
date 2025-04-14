import shell from 'shelljs';
import colors from 'colors';
import { folderExists, getAbsolutePath } from '../utils/files.js';
import {
	addBoilerplate,
	getBoilerplates,
	getSettings,
	removeBoilerplate,
	updateBoilerplate,
} from './settings.js';
import {
	printActionResults,
	printBoilerplatesTable,
	printDataPreview,
	printMsg,
	printError,
} from '../utils/ui.js';
import { cloneRepository } from './repository.js';
import faber from '../api/faber.js';
import { runActions } from './actions.js';
import { validateActions } from './validation.js';
import { endOfJson, parseJsonData } from '../utils/data.js';
import {
	askJsonData,
	askBoilerplateUpdateConfirmation,
	askBoilerplateChoice,
	askToProceedWithProvidedData,
	askActionWithExistingFolder,
} from './prompts.js';
import { existsSync } from 'fs';
import { addBoilerplateMessage } from '../utils/constants.js';

/**
 * Handles the `execute` command.
 * @param {object} options - The command arg options.
 */
export async function handleExecCommand(options) {
	// Check if the config file exists
	const configFileName = 'faberconfig';
	let configFile = '';
	for (let ext of ['js', 'cjs', 'mjs']) {
		const filePath = getAbsolutePath(`${configFileName}.${ext}`);
		if (existsSync(filePath)) {
			configFile = filePath;
			break;
		}
	}
	if (!configFile) {
		const pwd = shell.pwd();
		printError(
			`Fetching error`,
			`No ${configFileName} file found at ${colors.cyan(pwd)}.`
		);
		shell.exit(0);
	}

	// Imports the config file
	let config = null;
	try {
		config = await import(`file:///${configFile}`);
	} catch (error) {
		printError(
			'Parsing error',
			`An error occurred while reading the ${configFileName} file.`,
			error
		);
		shell.exit(0);
	}
	config.default(faber);

	// Get JSON data
	let data = null;
	if (options.data) {
		try {
			data = parseJsonData(options.data);
		} catch (error) {
			printError(
				'Parsing error',
				`The provided data is not a valid JSON.`,
				error
					.toString()
					.replace(
						/(SyntaxError.*?(?=\n|$))/,
						`$1: ${endOfJson(options.data, 20).gray + '‹'.yellow}`
					)
			);
			shell.exit(1);
		}
	} else {
		const { json } = await askJsonData();
		data = parseJsonData(json);
	}

	// Add the reserved properties
	const dirName = shell.pwd().split('/').pop();
	data._dirName = dirName;

	// Print JSON data preview
	const hasData =
		data && typeof data === 'object' && Object.keys(data).length > 0;
	if (options.preview && data) {
		if (typeof data === 'object' && Object.keys(data).length === 0) {
			printMsg(`No data was provided.\n`, 'muted');
		} else {
			console.log('');
			printMsg(
				colors.bold(`Provided data:`) +
					colors.gray(` (you can use --no-preview to omit this)`),
				'',
				' '
			);
			printDataPreview(data, options.deepPreview);

			// Check if there are objects or arrays
			let hasObjectOrArray = false;
			Object.keys(data).forEach((key) => {
				if (typeof data[key] === 'object' && data[key] !== null) {
					hasObjectOrArray = true;
				}
			});
			if (hasObjectOrArray) {
				console.log(
					colors.gray(
						options.deepPreview
							? `(Using --deep-preview for objects and arrays)\n`
							: `(You can use the --deep-preview option for viweing objects and arrays details)\n`
					)
				);
			}
		}

		// Confirm to proceed with provided data
		const { proceedWithProvidedData } = await askToProceedWithProvidedData(
			hasData
		);
		if (!proceedWithProvidedData) {
			printMsg(`Operation cancelled\n`, 'muted');
			shell.exit(0);
		}
	}

	// Run boilerplate actions
	let results = [];
	let actions = null;

	try {
		actions = faber.actions(data);
	} catch (error) {
		printError(
			'Preparation error',
			'An error occurred reading the actions.',
			error
		);
		shell.exit(0);
	}

	try {
		validateActions(actions);
	} catch (error) {
		printError(
			'Validation error',
			'There are invalid action settings or data.',
			error
		);
		shell.exit(0);
	}

	try {
		results = await runActions(actions);
	} catch (error) {
		printError(
			'Execution error',
			'An error occurred executing the actions.',
			error
		);
		shell.exit(0);
	}

	// Print results
	console.log('');
	printMsg(`Actions applied successfully.\n`, 'success', '✔');
	if (options.results && results.length) {
		printMsg(
			colors.bold(`Results:`) +
				colors.gray(` (you can use --no-results to omit this)`),
			'',
			' '
		);
		printActionResults(results);
	}
}

/**
 * Handles the `create` command.
 * @param {string} name - The name of the new folder.
 * @param {string} repositoryUrl - The URL of the repository to clone.
 * @param {object} options - The command arg options.
 */
export async function handleCreateCommand(name, repositoryUrl, options) {
	try {
		// Check if git is installed
		if (
			!shell.which('git') &&
			!(options.useExisting || options.overrideExisting)
		) {
			printMsg(`Sorry, this script requires git.`, 'error');
			printMsg(
				`Make sure you have git installed and available before running this command.`,
				'',
				' '
			);
			shell.exit(1);
		}

		// Check if folder already exists
		if (
			folderExists(name) &&
			!options.useExisting &&
			!options.overrideExisting
		) {
			printMsg(
				`There is already a folder named \`*${name}*\` on this directory.`,
				'warn'
			);
			const { actionWithExistingFolder } =
				await askActionWithExistingFolder();

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
			let cloneUrl = repositoryUrl;

			if (!cloneUrl) {
				const boilerplates = await getBoilerplates();

				if (!boilerplates.length) {
					printMsg(
						`No boilerplate provided or configured. Provide one, or create an alias.\n`,
						'warn'
					);
					printMsg(addBoilerplateMessage, 'info', '');
					return;
				}

				const { boilerplate } = await askBoilerplateChoice(boilerplates);
				cloneUrl = boilerplate.repo;
			}

			if (options.overrideExisting) {
				const silent = shell.config.silent;
				shell.config.silent = true;
				const removal = shell.rm('-rf', name);
				shell.config.silent = silent;
				if (removal.code !== 0) {
					const ebusy = removal.stderr.match(/code EBUSY/);
					printError(
						`Deleting error`,
						`Unable to delete directory` +
							(ebusy ? ' (currently open in another program).' : '.'),
						removal.stderr
					);
					shell.exit(removal.code);
				}
			}

			try {
				printMsg(`Cloning repository...`, 'info');
				await cloneRepository(cloneUrl, name, options.branch);
			} catch (err) {
				printError(`Cloning error`, `Unable to clone the repository.`, err);
				shell.exit(1);
			}

			if (!options.keepGit) {
				shell.rm('-rf', `${name}/.git`);
			}
		}
	} catch (error) {
		console.error(error);
	}

	// Continue with the `run` command
	shell.cd(name);
	process.env.ROOT_DIRECTORY = process.cwd();
	await handleExecCommand(options);
}

const addArgs = '<alias> <clone_url> [name]';
/**
 * Handles the `add` command.
 * @param {string} alias - The alias of the boilerplate.
 * @param {string} repo - The repository of the boilerplate.
 * @param {string} name - The name of the boilerplate.
 */
export async function handleAddCommand(alias, repo, name) {
	try {
		const settings = await getSettings();
		const boilerplate = { alias, repo, name: name || '' };

		const existingBoilerplate = settings.boilerplates?.find(
			(b) => b.alias === alias
		);
		if (existingBoilerplate) {
			printMsg(
				`A boilerplate with alias *${alias}* already exists:`,
				'warn'
			);
			printBoilerplatesTable([existingBoilerplate]);

			const { shouldUpdate } = await askBoilerplateUpdateConfirmation();

			shouldUpdate && (await updateBoilerplate(alias, boilerplate));
			return;
		}

		await addBoilerplate(boilerplate);
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
			printMsg('There are no boilerplates to list\n', 'warn');
			printMsg(addBoilerplateMessage, 'info', '');
			return;
		}

		printBoilerplatesTable(boilerplates);
	} catch (error) {
		console.error(error);
	}
}
