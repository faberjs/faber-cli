#!/usr/bin/env node

// Libraries
const colors = require('colors');
const commander = require('commander');
const consolidate = require('consolidate');
const inquirer = require('inquirer');
const ora = require('ora');
const del = require('del');
const fs = require('fs');
const path = require('path');
const argv = require('minimist')(process.argv.slice(2));
const Liftoff = require('liftoff');
//const v8flags = require('v8flags');

// Utils
const log = require('./utils/log');

// Config and definitions
const faberCmds = ['update', 'help'];
const faberCli = new Liftoff({
	name: 'faber',
	moduleName: 'faber-cli',
	configName: '.faber',
	extensions: {
		'rc.js': null,
		'.js': null,
	},
	v8flags: ['--harmony'],
});
faberCli.launch(
	{
		cwd: argv.cwd,
	},
	init
);

// Execute task with given env
function init(env) {
	// VERSION command
	const package = require('./package.json');
	commander.version(package.version);

	// FABER command (No command provided)
	if (argv._.length === 0) {
		const figlet = require('figlet');

		console.log(figlet.textSync('Faber', { font: 'slant' }));
		console.log(`${'Faber'.green} version ${package.version.yellow}`);
		return;
	}

	// UPDATE command
	commander
		.command('update')
		.description('Updates Faber CLI to the latest version')
		.action(async () => {
			log('Update Faber'.cyan);
		});

	// CUSTOM commands
	if (faberCmds.indexOf(argv._[0]) === -1) {
		if (!env.configPath) {
			// log(colors.red(`${argv._[0].cyan} command not recognized.`));
			// log(`Use ${'faber help'.yellow} to check the available commands`);
			log(colors.yellow(`Config file not found at ${env.cwd.magenta}`));
		} else {
			const rcFile = require(env.configPath);
			Object.entries(rcFile).forEach(([task, config]) => {
				// Build command structure
				let command = `${task}`;
				if (config.hasOwnProperty('args')) {
					config.args.forEach((arg) => {
						command += arg.charAt(arg.length - 1) === '?' ? ` [${arg}]` : ` <${arg}>`;
					});
				}

				// Register custom command
				commander
					.command(command)
					.description(config.hasOwnProperty('description') ? config.description : '')
					.action(async () => {
						let context = { teste: 'TESTE-AQUI' };

						// Identify args
						if (config.hasOwnProperty('args')) {
							config.args.forEach((arg, i) => {
								context[arg.replace(/\?$/, '')] =
									argv._.length > i + 1 ? argv._[i + 1] : undefined;
							});
						}

						// Run filter function to customize context data
						if (config.hasOwnProperty('filter')) {
							config.filter(context);
						}

						// Set default template engine when not defined
						config.files.forEach((file) => {
							file.compiler = file.hasOwnProperty('compiler')
								? file.compiler
								: config.compilers[0];
						});

						//console.log(config.files);
						//process.exit();

						// Compile and write files
						for (const engine of config.compilers) {
							for (const file of config.files.filter((file) => file.compiler === engine)) {
								try {
									console.log('CONTEXTO', context);
									const result = await consolidate[engine](file.template, context);
									console.log(`Compiled using ${engine}`.green);
									console.log(result);
								} catch (err) {
									throw err;
								}
							}
						}

						/* if (config.hasOwnProperty('args')) {
							console.log(
								`${colors.green('[OK]')} Faber new task: ${colors.cyan(
									task
								)}; with args`
							);
						} else {
							console.log(
								`${colors.green('[OK]')} Faber new task: ${colors.cyan(
									task
								)}; with no args;`
							);
						} */
					});
			});

			//console.log(commander);
		}
	}

	commander.parse(process.argv);
}
