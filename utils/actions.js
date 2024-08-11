import replace from 'replace-in-file';
import fs from 'fs';
import shell from 'shelljs';
import colors from 'colors';
import Joi from 'joi';
import { deleteAsync } from 'del';
import { moveFile } from 'move-file';
import { getRelativePath, getAbsolutePath } from './files.js';
import { printMsg } from './ui.js';
import { getConditionalCommentPatterns } from './regex.js';

/**
 * Validates the actions object.
 * @param {object[]} actions The actions object.
 * @throws {Error} If the actions object is not valid.
 * @returns {void}
 */
export function validateActions(actions) {
	if (!Array.isArray(actions)) {
		// Check if the returned actions value is an array
		throw new Error(`The ${colors.cyan(`setActions()`)} callback function must return an array.`);
	}

	const availableActions = ['replace', 'conditional', 'move', 'delete', 'run'];
	actions.forEach((action, index) => {
		if (!action.hasOwnProperty('type')) {
			throwActionError(index, action, 'validation', `\`${action.type.bold}\` property not found on action`);
		}

		if (!availableActions.includes(action.type)) {
			throwActionError(index, action, 'validation', `\`${action.type.bold}\` is not a valid action type`);
		}

		switch (action.type) {
			case 'replace':
				(function () {
					const schema = Joi.object({
						type: Joi.string().valid('replace').required(),
						files: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).required(),
						ignore: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())),
						from: Joi.alternatives()
							.try(Joi.string(), Joi.object().regex(), Joi.array().items(Joi.string(), Joi.object().regex()))
							.required(),
						to: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).required(),
					}).unknown();

					// Validates settings for the `replace` action
					const results = schema.validate(action);
					results.error && throwActionError(index, action, 'validation', results.error.message);
				})();
				break;

			case 'conditional':
				(function () {
					const schema = Joi.object({
						type: Joi.string().valid('conditional').required(),
						files: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).required(),
						ignore: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())),
						identifier: Joi.string().required(),
						condition: Joi.boolean().required(),
					}).unknown();

					// Validates settings for the `conditional` action
					const results = schema.validate(action);
					results.error && throwActionError(index, action, 'validation', results.error.message);
				})();
				break;

			case 'delete':
				(function () {
					const schema = Joi.object({
						type: Joi.string().valid('delete').required(),
						paths: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).required(),
					}).unknown();

					// Validates settings for the `delete` action
					const results = schema.validate(action);
					results.error && throwActionError(index, action, 'validation', results.error.message);
				})();
				break;

			case 'move':
				(function () {
					const schema = Joi.object({
						type: Joi.string().valid('move').required(),
						from: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).required(),
						to: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).required(),
					}).unknown();

					// Validates settings for the `move` action
					const results = schema.validate(action);
					results.error && throwActionError(index, action, 'validation', results.error.message);
				})();
				break;

			case 'run':
				(function () {
					const schema = Joi.object({
						type: Joi.string().valid('run').required(),
						command: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).required(),
						silent: Joi.boolean(),
					}).unknown();

					// Validates settings for the `run` action
					const results = schema.validate(action);
					results.error && throwActionError(index, action, 'validation', results.error.message);
				})();
				break;

			default:
				break;
		}

		/**
		 * Prints an error message with action details
		 * @param {number} index The action index.
		 * @param {string} action The action type.
		 * @param {string} context The error context.
		 * @param {string} message The error message.
		 */
		function throwActionError(index, action, context, message) {
			let label = '[ERROR] '.red.bold;
			context && (label += `(${context}): `);
			console.error(
				label + adaptJoiMessage(message) + '.' // TODO: Add link to documentation
			);
			console.warn('\nAction details:'.gray);
			console.dir(action);
			console.log();
			process.exit(1);
		}
	});

	// No errors found
	return;
}

export async function runActions(actions) {
	return new Promise(async (resolve, reject) => {
		try {
			if (Array.isArray(actions)) {
				let results = [];
				for (const [index, action] of actions.entries()) {
					switch (action.type) {
						case 'replace':
							try {
								const replacementsResults = await runReplacements(
									action.files,
									action.ignore || [],
									action.from,
									action.to
								);
								results = results.concat(
									replacementsResults
										.filter((result) => result.hasChanged)
										.map((result) => {
											return {
												action: index + 1,
												type: action.type,
												path: result.file,
												count: result.numReplacements,
											};
										})
								);
							} catch (err) {
								reject(
									`On action [${colors.cyan(index + 1)}] (of type \`${colors.cyan(action.type)}\`). ${err}`
								);
							}
							break;
						case 'conditional':
							try {
								const contitionalsResults = await runConditionals(
									action.files,
									action.ignore || [],
									action.identifier,
									action.condition
								);
								results = results.concat(
									contitionalsResults
										.filter((result) => result.hasChanged)
										.map((result) => {
											return {
												action: index + 1,
												type: action.type,
												path: result.file,
												count: result.numReplacements,
											};
										})
								);
							} catch (err) {
								reject(
									`On action [${colors.cyan(index + 1)}] (of type \`${colors.cyan(action.type)}\`). ${err}`
								);
							}
							break;
						case 'move':
							try {
								const movingResults = await runMoving(action.from, action.to);
								results = results.concat(
									movingResults
										.filter((r) => r.moved)
										.map((result) => {
											return {
												action: index + 1,
												type: action.type,
												path: result.from,
												result: result.to,
												overriden: result.overriden,
											};
										})
								);
							} catch (err) {
								reject(
									`On action [${colors.cyan(index + 1)}] (of type \`${colors.cyan(action.type)}\`). ${err}`
								);
							}
							break;
						case 'delete':
							try {
								const deletionsResults = await runDeletions(action.paths);
								results = results.concat(
									deletionsResults.map((deleted) => {
										return {
											action: index + 1,
											type: action.type,
											path: getRelativePath(deleted),
										};
									})
								);
							} catch (err) {
								reject(
									`On action [${colors.cyan(index + 1)}] (of type \`${colors.cyan(action.type)}\`). ${err}`
								);
							}
							break;
						case 'run':
							try {
								const commandsResults = await runCommands(action.command, action.silent);
								results = results.concat(
									commandsResults.map((executed) => {
										return {
											action: index + 1,
											type: action.type,
											command: executed.command,
											result: executed.result,
										};
									})
								);
							} catch (err) {
								reject(
									`On action [${colors.cyan(index + 1)}] (of type \`${colors.cyan(action.type)}\`). ${err}`
								);
							}
							break;
						default:
							break;
					}
				}
				resolve(results);
			}
		} catch (err) {
			reject(err);
		}
	});
}

async function runReplacements(files, ignore, from, to) {
	return await replace({
		files,
		ignore,
		from,
		to,
		countMatches: true,
	});
}

async function runConditionals(files, ignore, identifier, condition) {
	const { positivePatterns, negativePatterns } = getConditionalCommentPatterns(identifier, condition);

	return new Promise(async (resolve, reject) => {
		try {
			let results = [];
			for (const positivePattern of positivePatterns) {
				const res = await replace({ files, from: positivePattern, to: '$1', countMatches: true, ignore });
				results = [...results, ...res];
			}
			for (const negativePattern of negativePatterns) {
				const res = await replace({ files, from: negativePattern, to: '', countMatches: true, ignore });
				results = [...results, ...res];
			}
			let uniqueResults = results.reduce((acc, res) => {
				if (acc[res.file]) {
					acc[res.file].numReplacements += res.numReplacements;
					acc[res.file].numMatches += res.numMatches;
					acc[res.file].hasChanged = acc[res.file].hasChanged || res.hasChanged;
					return acc;
				} else {
					acc[res.file] = {
						file: res.file,
						numReplacements: res.numReplacements,
						numMatches: res.numMatches,
						hasChanged: res.hasChanged,
					};
					return acc;
				}
			}, {});

			resolve(Object.values(uniqueResults));
		} catch (err) {
			reject(err);
		}
	});
}

async function runDeletions(paths) {
	return await deleteAsync(paths);
}

async function runMoving(from, to) {
	return new Promise(async (resolve, reject) => {
		try {
			const results = [];
			if (Array.isArray(from) && Array.isArray(to) && from.length === to.length) {
				for (const [index, fromPath] of from.entries()) {
					const alreadyExists = fs.existsSync(getAbsolutePath(to[index]));
					await moveFile(fromPath, to[index]);
					//await fs.promises.rename(fromPath, to[index]);
					const moved = fs.existsSync(getAbsolutePath(to[index]));
					if (from !== to && moved) {
						results.push({
							from: fromPath,
							to: to[index],
							moved,
							overriden: alreadyExists,
						});
					}
				}
			} else {
				const alreadyExists = fs.existsSync(getAbsolutePath(to));
				await moveFile(from, to);
				const moved = fs.existsSync(getAbsolutePath(to));
				if (from !== to && moved) {
					results.push({
						from: from,
						to: to,
						moved,
						overriden: alreadyExists,
					});
				}
			}
			resolve(results);
		} catch (err) {
			reject(err);
		}
	});
}

function runCommands(commands, silent = true) {
	return new Promise(async (resolve, reject) => {
		try {
			const results = [];

			// List all commands
			const commandsToRun = [];
			if (Array.isArray(commands)) {
				commands.forEach((command) => {
					const subcommands = command.split(/&&|;/g);
					subcommands.forEach((subcommand) => {
						commandsToRun.push(subcommand.trim());
					});
				});
			} else if (typeof commands === 'string') {
				const subcommands = commands.split(/&&|;/g);
				subcommands.forEach((subcommand) => {
					commandsToRun.push(subcommand.trim());
				});
			}

			// Run each command
			for (let i = 0; i < commandsToRun.length; i++) {
				const command = commandsToRun[i].trim();
				if (!silent) {
					console.log('');
					printMsg(`Running command: ${colors.magenta(command)}`, 'muted', '$');
				}
				const shellResults = /^cd /.test(command)
					? await shell.cd(command.replace('cd ', ''))
					: await shell.exec(command, { silent });
				if (shellResults.code === 0) {
					results.push({
						command,
						result: {
							code: shellResults.code,
							stdout: shellResults.stdout,
							stderr: shellResults.stderr,
						},
					});
					await returnToRootDirectory();
				} else {
					await returnToRootDirectory();
					reject(shellResults.stderr);
				}
			}

			resolve(results);
		} catch (err) {
			reject(err);
		}
	});
}

function adaptJoiMessage(message) {
	const coloredProperty = colors.cyan('$1');
	return message
		.replace(/"(\w+)" is/, `The \`${coloredProperty}\` property is`)
		.replace(/"(\w+)" must be/, `The \`${coloredProperty}\` property must be`);
}

async function returnToRootDirectory() {
	shell.cd(process.env.ROOT_DIRECTORY);
}
