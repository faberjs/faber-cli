import colors from 'colors';
import inquirer from 'inquirer';
import { parseJsonData } from './data.js';

export async function askJsonData() {
	return inquirer.prompt([
		{
			type: 'input',
			name: 'json',
			message: `Paste the project data`,
			suffix: ` (minified JSON):`.grey,
			validate: (input) => {
				return parseJsonData(input)
					? true
					: ` The provided data doesn't seem to be a valid JSON.`.red +
							` Make sure the JSON is minified or encoded, and in one single line.`.red;
			},
		},
	]);
}

export async function askBoilerplateUpdateConfirmation() {
	return inquirer.prompt([
		{
			type: 'confirm',
			name: 'shouldUpdate',
			message: 'Do you want to update this boilerplate?',
			default: false,
		},
	]);
}

export async function askBoilerplateChoice(boilerplates) {
	return inquirer.prompt([
		{
			type: 'list',
			name: 'boilerplate',
			message: `Choose a boilerplate:`,
			choices: boilerplates.map((b) => ({ name: `${b.name} ${colors.gray(`(${b.repo})`)}`, value: b.alias })),
			filter: (alias) => boilerplates.find((b) => b.alias === alias),
		},
	]);
}

export async function askActionWithExistingFolder() {
	return inquirer.prompt({
		type: 'list',
		name: 'actionWithExistingFolder',
		message: `How do you want to proceed?`,
		default: 'cancel',
		choices: [
			{
				name: `Cancel ${colors.gray(`(stop the execution)`)}`,
				short: 'Cancel',
				value: 'cancel',
			},
			{
				name: `Continue with this folder ${colors.gray(`(git clone will be skipped)`)}`,
				short: 'Continue with folder',
				value: 'continue',
			},
			{
				name: `Override existing folder ${colors.gray(`(the folder will be deleted)`)}`,
				short: 'Override folder',
				value: 'override',
			},
		],
	});
}

export async function askToProceedWithProvidedData(hasData = true) {
	return inquirer.prompt({
		type: 'confirm',
		name: 'proceedWithProvidedData',
		message: hasData ? `Do you want to continue with the provided data?` : `Do you want to continue without data?`,
		default: true,
	});
}
