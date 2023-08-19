import colors from 'colors';

export async function askJsonData() {
	return inquirer.prompt([
		{
			type: 'input',
			name: 'json',
			message: `Paste the project data`,
			suffix: ` (minified JSON):`.grey,
			validate: (input) => {
				let json = {};
				try {
					json = JSON.parse(input);
				} catch (err) {
					return (
						` The provided data doesn't seem to be a valid JSON.`.red +
						` Make sure the JSON is minified and in one single line.`.red
					);
				}
				return true;
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

export async function askToContinueWithExistingFolder() {
	return inquirer.prompt({
		type: 'confirm',
		name: 'proceedWithExistingFolder',
		message: `Do you want to continue with this folder?`,
		suffix: ` (git clone will be skipped)`,
		default: false,
	});
}
