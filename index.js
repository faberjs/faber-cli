#!/usr/bin/env node

// Libraries
const colors = require('colors');
//const commander = require('commander');
const consolidate = require('consolidate');
const inquirer = require('inquirer');
//const ora = require('ora');
//const del = require('del');
const fs = require('fs');
//const path = require('path');
const argv = require('minimist')(process.argv.slice(2));
const Liftoff = require('liftoff');
const { Table } = require('console-table-printer');
//const v8flags = require('v8flags');

// Utils
const log = require('./utils/log');
const package = require('./package.json');

// Config and definitions
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

// Config faber commands
const commands = require('./utils/commands');

// Execute task with given env
async function init(env) {
	// FABER default command (No command provided)
	if (argv._.length === 0) {
		const figlet = require('figlet');

		console.log(figlet.textSync('Faber', { font: 'slant' }));
		console.log(`${'Faber'.cyan} version ${package.version.yellow}`);
		process.exit();
	} else {
		const cmd = argv._[0];

		// FABER commands (version, help)
		if (Object.keys(commands).includes(cmd)) {
			commands[cmd].action(commands[cmd]);
			process.exit();
		} else {
			if (!env.configPath) {
				log(colors.yellow(`Config file not found at ${env.cwd.magenta}`));
				process.exit();
			} else {
				const rcFile = require(env.configPath);

				// CUSTOM commands
				if (Object.keys(rcFile.tasks).includes(cmd)) {
					const config = rcFile.tasks[cmd];
					config.command = cmd;
					config.args = config.hasOwnProperty('args') ? Object.entries(config.args) : [];
					config.usage = getCommandUsage(config);

					// Placeholder for caching tested directories
					env.existingPaths = [];

					// console.log(cmd, config);

					let context = { teste: 'TESTE-AQUI' };

					// Identify args
					config.args.forEach(([arg, isRequired], i) => {
						context[arg] = argv._.length > i + 1 ? argv._[i + 1] : undefined;
						if (isRequired && context[arg] === undefined) {
							log(
								`${'Invalid command:'.red.bold} \n\t  Required argument ${
									`<${arg}>`.magenta.bold
								} not provided.\n`
							);
							log(`${'Usage:'.cyan.bold} \n\t  ${config.usage}\n`);
							process.exit();
						}
					});

					// Run filter function to customize context data
					if (config.hasOwnProperty('filterContext')) {
						config.filterContext(context);
					}

					// Set default template engine when not defined
					config.files.forEach((file) => {
						file.templateEngine = file.hasOwnProperty('templateEngine')
							? file.templateEngine
							: config.templateEngines[0];
					});

					// Prepate table for displaying results
					const results = new Table({
						columns: [
							{ name: 'Output', alignment: 'left' },
							{ name: 'Compiler', alignment: 'left' },
						],
					});

					// Compile and write files
					for (const engine of config.templateEngines) {
						for (const file of config.files.filter(
							(file) => file.templateEngine === engine
						)) {
							let content = null;

							// Tries to get compiled content with template engine
							try {
								content = await consolidate[engine](file.template, context);
							} catch (err) {
								log(
									`${'Error:'.red.bold} \n\t  A problem occurred trying to compile ${
										file.template.cyan.bold
									}\n`
								);
								throw err;
							}

							// Generate a list with all paths to consider
							let dirs = file.output.split('/').filter((dir) => dir !== '.');
							dirs.pop(); // Remove file name
							const paths = [];
							dirs.forEach((dir, index) => {
								let dirPath = `.`;
								dirs.forEach((d, i) => {
									if (i <= index) {
										dirPath += `/${d}`;
									}
								});
								paths.push(dirPath);
							});

							try {
								// Identify which paths already exist or need to be created
								const dirsToCreate = [];
								paths.forEach((dir) => {
									if (!env.existingPaths.includes(dir) && !fs.existsSync(dir)) {
										dirsToCreate.push(dir);
									} else {
										env.existingPaths.push(dir);
									}
								});

								// Create non-existing directories
								if (dirsToCreate.length) {
									const { mkdir } = require('fs').promises;

									for (const [index, dir] of dirsToCreate.entries()) {
										await mkdir(dir);
									}
								}
							} catch (err) {
								log(
									`${'Error:'.red.bold} \n\t  Unable to create output folder for ${
										file.output.cyan
									}\n`
								);
								throw err;
							}

							try {
								// Write file with compiled content
								fs.writeFileSync(file.output, content);
							} catch (err) {
								log(
									`${'Error:'.red.bold} \n\t  Unable to write file ${file.output.cyan}\n`
								);
								throw err;
							}

							// Log results
							results.addRow({
								Output: file.output.cyan,
								Compiler: file.templateEngine.green,
							});
						}
					}

					// Show results
					console.log();
					log(`${'Completed:'.green.bold} \n\t  Files generated successfuly.\n`);
					results.printTable();
				}

				// Command not found
				else {
					log(colors.red(`Command ${cmd.magenta} no found.`));
				}
			}
		}
	}
}

/**
 * Returns instructions on how to use the command
 * @param {object} config Task configuration object
 * @returns {string}
 */
function getCommandUsage(config) {
	let usage = `faber ${config.command}`;
	config.args.forEach(([arg, isRequired]) => {
		usage += isRequired ? ` <${arg}>` : ` [${arg}]`;
	});
	return usage;
}
