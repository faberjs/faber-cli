#!/usr/bin/env node

import { program } from 'commander';
import { readFile } from 'fs/promises';
import { Commands } from './core/definitions.js';

const pkg = JSON.parse(
	await readFile(new URL('../package.json', import.meta.url))
);

process.env.ROOT_DIRECTORY = process.cwd();

program
	.name('faber')
	.description('A CLI for creating projects from custom boilerplates.')
	.version(
		pkg.version,
		'-v, --version',
		'Display the installed version of the CLI'
	);

// Configure commands
Commands.forEach(({ name, description, args, options, handler }) => {
	const command = program.command(name).description(description);
	args.forEach((arg) => {
		command.argument(
			arg.required ? `<${arg.name}>` : `[${arg.name}]`,
			arg.description || ''
		);
	});
	// Replicate `execute` options for `create` command
	if (name === 'create') {
		const execCommand = Commands.find((c) => c.name === 'execute');
		if (execCommand) options = [...options, ...(execCommand.options || [])];
	}
	options.forEach((option) => {
		command.option(
			option.type === 'string'
				? `--${option.name} <string>`
				: `--${option.name}`,
			option.description || ''
		);
	});
	command.action(handler);
});

program.parse(process.argv);
