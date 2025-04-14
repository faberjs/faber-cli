import colors from 'colors';

export const addBoilerplateMessage = [
	`You can create a boilerplate alias with the \`${colors.cyan(
		`faber add`
	)}\` command.`,
	'',
	colors.bold(`Example:`),
	'$ '.gray +
		colors.cyan(
			`faber add faber-demo git@github.com:faberjs/faber-demo.git 'Faber Demo'`
		),
	'',
].join('\n');
