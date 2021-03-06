#!/usr/bin/env node

const colors = require('colors');
const commander = require('commander');
const inquirer = require('inquirer');
const ora = require('ora');
const del = require('del');
const fs = require('fs');
const path = require('path');
const argv = require('minimist')(process.argv.slice(2));
const Liftoff = require('liftoff');
//const v8flags = require('v8flags');

const faberCmds = ['update', 'help'];

// Create faber instance
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

// Init CLI
faberCli.launch(
	{
		cwd: argv.cwd,
	},
	init
);

// Execute task with given context
function init(context, arg) {
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
		if (!context.configPath) {
			// log(colors.red(`${argv._[0].cyan} command not recognized.`));
			// log(`Use ${'faber help'.yellow} to check the available commands`);
			log(colors.yellow(`Config file not found at ${context.cwd.magenta}`));
		} else {
			const rcFile = require(context.configPath);
			Object.entries(rcFile).forEach(([task, config]) => {
				commander
					.command(config.hasOwnProperty('argument') ? `${task} <${config.argument}>` : `${task}`)
					.description(config.hasOwnProperty('description') ? config.description : '')
					.action(async (action) => {
						if (config.hasOwnProperty('argument')) {
							console.log(
								`${colors.green('[OK]')} Faber new task: ${colors.cyan(task)}; with args: ${colors.cyan(
									action
								)};`
							);
						} else {
							console.log(`${colors.green('[OK]')} Faber new task: ${colors.cyan(task)}; with no args;`);
						}
					});
			});
		}
	}

	commander.parse(process.argv);
}

const log = function (message = '') {
	console.log(`[${colors.gray('Faber')}] ${message}`);
};

// let spinner;

// //console.log(process.argv);

// // UPDATE command
// commander
// 	.command('update')
// 	.description('Updates Faber CLI to the latest version')
// 	.action(async () => {
// 		console.log(process.argv)
// 	});

// // HELP command
// commander
// 	.command('help')
// 	.description('Show available tasks')
// 	.action(async () => {
// 		console.log(colors.green('TODO: build intetesting display of available tasks'));
// 		return;
// 	});

// // CUSTOM commands
// const rcFilePath = `${process.cwd()}/faberrc.js`;
// if(fs.existsSync(rcFilePath)) {
// 	const rcFile = require(rcFilePath);

// 	// Check for valid config
// 	if( ! verifyConfigFile(rcFile) ) {
// 		return;
// 	}

// 	Object.entries(rcFile).forEach(([task, config]) => {
// 		commander
// 			.command( config.hasOwnProperty('arg') ? `${task} <${config.arg}>` : `${task}` )
// 			.description( config.hasOwnProperty('description') ? config.description : '' )
// 			.action( async (action) => {
// 				if(config.hasOwnProperty('arg')) {
// 					console.log(`${colors.green('[OK]')} Faber new task: ${colors.cyan(task)}; with args: ${colors.cyan(action)};`);
// 				} else {
// 					console.log(`${colors.green('[OK]')} Faber new task: ${colors.cyan(task)}; with no args;`);
// 				}
// 			});
// 	});
// } else {
// 	console.log(colors.red(`Configuration file not found in th current folder (${rcFile}).`));
// 	return;
// }

// /**
//  * Check if the configuration file has a valid content
//  * @param {object} rcFile Content of the config file
//  */
// function verifyConfigFile(rcFile) {
// 	if(typeof rcFile === 'object') {
// 		return true;
// 	} else {
// 		console.log(colors.red(`Configuration file doesn't seem to be valid.`));
// 		return false;
// 	}
// }

// commander.parse(process.argv);
