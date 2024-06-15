import Table from 'cli-table';
import colors from 'colors';

/**
 * Prints a message to the console.
 * @param {string} msg The message to print.
 * @param {string} [type=''] The type of message. Can be 'success', 'warn', 'error', 'muted' or '' (default).
 */
export function printMsg(msg, type = '', symbol = '!') {
	let message = msg.replace(/\*([^\b ].*?[^\b ])\*/g, colors.bold('$1')); // Bold with *text*
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

/**
 * Prints an error message to the console.
 * @param {string} type The error title.
 * @param {string} msg The message to print.
 * @param {string} details (Optional) The error details.
 */
export function printError(type, msg, error = '') {
	const message = colors.red('✖ ' + colors.bold(`${type}: `)) + msg;
	console.log(message);
	if (error) {
		typeof error === 'string' ? console.log('↳', error.replace(/\n$/, '')) : console.log('↳', error);
	}
	console.log();
}

/**
 * Prints a table to the console.
 * @param {string[]} headers The table headers.
 * @param {string[][]} rows The table rows.
 */
export function printTable(headers, rows) {
	const table = new Table({
		head: headers,
	});
	table.push(...rows);
	console.log(table.toString());
}

/**
 * Prints a table with the list of registered boilerplates.
 * @param {object[]} boilerplates The list of registered boilerplates.
 */
export function printBoilerplatesTable(boilerplates) {
	const headers = [colors.cyan.bold('Alias'), colors.cyan.bold('Repository URL'), colors.cyan.bold('Display Name')];
	const rows = boilerplates.map((b) => [b.alias, b.repo, b.name === '' ? colors.gray('undefined') : b.name]);
	printTable(headers, rows);
}

/**
 * Prints the results of the actions.
 * @param {object[]} actionResults The actions' results objects.
 */
export function printActionResults(actionResults) {
	const resultRows = [];
	actionResults.forEach((r) => {
		switch (r.type) {
			case 'replace':
				resultRows.push([
					r.action,
					r.type,
					`Updated ${colors.magenta(r.path)} with ${colors.green(r.count)} ${
						r.count === 1 ? 'replacement' : 'replacements'
					}`,
				]);
				break;

			case 'conditional':
				resultRows.push([
					r.action,
					r.type,
					`Updated ${colors.magenta(r.path)} with ${colors.green(r.count)} conditional ${
						r.count === 1 ? 'replacement' : 'replacements'
					}`,
				]);
				break;

			case 'delete':
				resultRows.push([r.action, r.type, `Deleted ${colors.magenta(r.path)}`]);
				break;

			case 'move':
				let msg = '';
				const pathFrom = r.path.split('/');
				const filenameFrom = pathFrom.pop();
				const pathTo = r.result.split('/');
				const filenameTo = pathTo.pop();

				const wasMoved = pathFrom.join('/') !== pathTo.join('/');
				const wasRenamed = filenameFrom !== filenameTo;

				if (wasRenamed && wasMoved) {
					msg += `Moved ${colors.magenta(r.path)} to ${colors.green(r.result)}`;
				} else if (wasMoved) {
					msg += `Moved ${colors.magenta(r.path)} to ${colors.green(r.result)}`;
				} else if (wasRenamed) {
					msg += `Renamed ${colors.magenta(r.path)} to ${colors.green(r.result)}`;
				}

				resultRows.push([r.action, r.type, msg + (r.overriden ? colors.gray(` (overriding existing)`) : '')]);
				break;

			case 'run':
				if (r.result.code === 0) {
					resultRows.push([r.action, r.type, `Executed \`${colors.magenta(r.command)}\` without errors.`]);
				}
				break;

			default:
				break;
		}
	});
	printTable([colors.cyan.bold('Action'), colors.cyan.bold('Type'), colors.cyan.bold('Result')], resultRows);
}

/**
 * Prints the data preview as a table
 * @param {object} data The data to preview.
 * @param {boolean} expanded Whether to show all the properties and array items expanded. Default is to show only the first level.
 */
export function printDataPreview(data, expanded = false) {
	const tableRows = [];

	function addRow(property, value, deepness = 0) {
		const type = typeof value;

		const prefix = deepness > 0 ? ' '.repeat(deepness - 1) + '∟' : '';
		let label = Number.isInteger(property) ? `[${colors.bold(property)}]` : colors.bold(property);
		if (property.startsWith('_')) {
			label = colors.gray(label);
		}
		label = prefix + label;

		switch (type) {
			case 'number':
				tableRows.push([label, colors.magenta(type), colors.green(value)]);
				break;
			case 'boolean':
				tableRows.push([
					label,
					colors.magenta(type),
					value ? colors.green.bold('✔') + colors.green(' true') : colors.red.bold('✗') + colors.red(' false'),
				]);
				break;
			case 'object':
				if (value === null) {
					tableRows.push([label, colors.magenta('null'), colors.blue('null')]);
					break;
				} else if (Array.isArray(value)) {
					const length = value.length;
					const description = length === 1 ? length + ' item' : length + ' items';
					tableRows.push([label, colors.magenta('array'), colors.gray(description)]);
					if (expanded) {
						value.forEach((item, i) => {
							addRow(i, item, deepness + 1);
						});
					}
					break;
				} else {
					const length = Object.keys(value).length;
					const description = length === 1 ? length + ' property' : length + ' properties';
					tableRows.push([label, colors.magenta(type), colors.gray(description)]);
					if (expanded) {
						Object.keys(value).forEach((key) => {
							addRow(key, value[key], deepness + 1);
						});
					}
					break;
				}
			case 'string':
				const str = value.length > 60 ? value.substring(0, 60) + '...' : value;
				tableRows.push([label, colors.magenta(type), str]);
				break;
			default:
				tableRows.push([label, colors.magenta(type), value]);
				break;
		}
	}

	Object.keys(data).forEach((key) => {
		addRow(key, data[key]);
	});

	printTable([colors.cyan.bold('Property'), colors.cyan.bold('Type'), colors.cyan.bold('Value')], tableRows);
}
