#!/usr/bin/env node

const commander	= require('commander');
const inquirer	= require('inquirer');
const colors	= require('colors');
const ora		= require('ora');
const del		= require('del');
const fs		= require('fs');
const path		= require('path');

let spinner;

//console.log(process.argv);

const package = require('./package.json');
const { exit } = require('process');
commander.version(package.version);

// UPDATE command
commander
	.command('update')
	.description('Updates Faber CLI to the latest version')
	.action(async () => {
		console.log(process.argv)
	});

// HELP command	
commander
	.command('help')
	.description('Show available tasks')
	.action(async () => {
		console.log(colors.green('TODO: build intetesting display of available tasks'));
		return;
	});

// CUSTOM commands
const rcFilePath = `${process.cwd()}/faberrc.js`;
if(fs.existsSync(rcFilePath)) {
	const rcFile = require(rcFilePath);

	// Check for valid config
	if( ! verifyConfigFile(rcFile) ) {
		return;
	}

	Object.entries(rcFile).forEach(([task, config]) => {
		commander
			.command( config.hasOwnProperty('arg') ? `${task} <${config.arg}>` : `${task}` )
			.description( config.hasOwnProperty('description') ? config.description : '' )
			.action( async (action) => {
				if(config.hasOwnProperty('arg')) {
					console.log(`${colors.green('[OK]')} Faber new task: ${colors.cyan(task)}; with args: ${colors.cyan(action)};`);
				} else {
					console.log(`${colors.green('[OK]')} Faber new task: ${colors.cyan(task)}; with no args;`);
				}
			});
	});
} else {
	console.log(colors.red(`Configuration file not found in th current folder (${rcFile}).`));
	return;
}

/**
 * Check if the configuration file has a valid content
 * @param {object} rcFile Content of the config file
 */
function verifyConfigFile(rcFile) {
	if(typeof rcFile === 'object') {
		return true;
	} else {
		console.log(colors.red(`Configuration file doesn't seem to be valid.`));
		return false;
	}
}

commander.parse(process.argv);