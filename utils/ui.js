import Table from 'cli-table';
import colors from 'colors';

export function printBoilerplatesTable(boilerplates) {
	const headers = [
		colors.cyan.bold('Boilerplate'),
		colors.cyan.bold('Repository URL'),
		colors.cyan.bold('Display Name'),
	];
	const table = new Table({
		head: headers,
	});
	table.push(...boilerplates.map((b) => [b.alias, b.repo, b.name === '' ? colors.gray('undefined') : b.name]));
	console.log(table.toString());
}

export function printMsg(msg, type = '', symbol = '!') {
	let message = msg.replace(/\*([^\b ].*?[^\b ])\*/g, colors.bold('$1'));
	message = symbol ? colors.bold(`${symbol} `) + message : message;

	switch (type) {
		case 'success':
			console.log(colors.green(message));
			return;
		case 'warn':
			console.log(colors.yellow(message));
			return;
		case 'error':
			console.log(colors.red(message));
			return;
		case 'muted':
			console.log(colors.gray(message));
			return;
		default:
			console.log(message);
			return;
	}
}
