import replace from 'replace-in-file';
import fs from 'fs';
import shell from 'shelljs';
import colors from 'colors';
import Joi from 'joi';
import { deleteAsync } from 'del';
import { moveFile } from 'move-file';
import { getRelativePath, getAbsolutePath } from './files.js';

/**
 * Validates the actions object.
 * @param {object[]} actions The actions object.
 * @throws {Error} If the actions object is not valid.
 * @returns {void}
 */
export function validateActions(actions) {
	if (!Array.isArray(actions)) {
		// Check if the returned actions value is an array
		throw new Error(`The ${colors.bold(`setActions()`)} callback function must return an array.`);
	}

	const availableActions = ['replace', 'conditional', 'move', 'delete', 'run'];
	actions.forEach((action, index) => {
		if (!action.hasOwnProperty('type')) {
			// Check if the action type is defined
			throw new Error(`The ${colors.bold(`type`)} property is required for each action.`);
		}

		if (!availableActions.includes(action.type)) {
			// Check if the action type is valid
			throw new Error(`\`${colors.magenta(action.type)}\` is not a valid action type.`);
		}

		switch (action.type) {
			case 'replace':
				(function () {
					const schema = Joi.object({
						type: Joi.string().valid('replace').required(),
						files: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).required(),
						from: Joi.alternatives()
							.try(Joi.string(), Joi.object().regex(), Joi.array().items(Joi.string(), Joi.object().regex()))
							.required(),
						to: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).required(),
					}).unknown();

					// Validates settings for the `replace` action
					const results = schema.validate(action);
					results.error && throwError(index, action, results.error.message);
				})();
				break;

			case 'conditional':
				(function () {
					const schema = Joi.object({
						type: Joi.string().valid('conditional').required(),
						files: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).required(),
						identifier: Joi.string().required(),
						condition: Joi.boolean().required(),
					}).unknown();

					// Validates settings for the `conditional` action
					const results = schema.validate(action);
					results.error && throwError(index, action, results.error.message);
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
					results.error && throwError(index, action, results.error.message);
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
					results.error && throwError(index, action, results.error.message);
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
					results.error && throwError(index, action, results.error.message);
				})();
				break;

			default:
				break;
		}

		/**
		 * Throws an error with the action index and type.
		 * @param {number} index The action index.
		 * @param {string} action The action type.
		 * @param {string} message The error message.
		 */
		function throwError(index, action, message) {
			throw new Error(
				`On action [${colors.cyan(`${index}`)}] (of type \`${action.type}\`) - ` + message + '.' // TODO: Add link to documentation
			);
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
								const replacementsResults = await runReplacements(action.files, action.from, action.to);
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
								reject(`Error in the action ${index + 1} (of type \`${action.type}\`). ${err}`);
							}
							break;
						case 'conditional':
							try {
								const contitionalsResults = await runConditionals(
									action.files,
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
								reject(`Error in the action ${index + 1} (of type \`${action.type}\`). ${err}`);
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
								reject(`Error in the action ${index + 1} (of type \`${action.type}\`). ${err}`);
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
								reject(`Error in the action ${index + 1} (of type \`${action.type}\`). ${err}`);
							}
							break;
						case 'run':
							try {
								const commands = [];

								// List all commands
								if (Array.isArray(action.command)) {
									action.command.forEach((command) => {
										const subcommands = command.split(/&&|;/g);
										subcommands.forEach((subcommand) => {
											commands.push(subcommand.trim());
										});
									});
								} else if (typeof action.command === 'string') {
									const subcommands = action.command.split(/&&|;/g);
									subcommands.forEach((subcommand) => {
										commands.push(subcommand.trim());
									});
								}

								// Execute each command
								for (let i = 0; i < commands.length; i++) {
									const command = commands[i].trim();
									const shellResults = await shell.exec(command, {
										silent: action.hasOwnProperty('silent') ? action.silent : true,
									});
									if (shellResults.code === 0) {
										results.push({
											action: index + 1,
											type: action.type,
											command: command,
											result: {
												code: shellResults.code,
												stdout: shellResults.stdout,
												stderr: shellResults.stderr,
											},
										});
									} else {
										reject(
											`Error in the action ${index + 1} (of type \`${action.type}\`). ${shellResults.stderr}`
										);
									}
								}
							} catch (err) {
								reject(`Error in the action ${index + 1} (of type \`${action.type}\`). ${err}`);
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

async function runReplacements(files, from, to) {
	return await replace({
		files,
		from,
		to,
		countMatches: true,
	});
}

async function runConditionals(files, identifier, condition) {
	const comments = [
		['\\/\\*\\*?', '*/'],
		['<!--', '-->'],
		['\\/\\/\\/?', 0],
		['##?', 0],
		['=begin', '=end'],
		['"""', '"""'],
		["'''", "'''"],
	];
	const openings = `((?:\\/\\*\\*?)|(?:<!--))`;
	const closures = `((?:\\*?\\*\\/)|(?:-->))`;

	const positivePattern = new RegExp(
		openings +
			' ?@faber-if: ?(' +
			(condition ? identifier : `! ?${identifier}`) +
			') ?' +
			closures +
			'\\n?((.|\\n)*?)\\1 ?@faber-endif: ?\\2 ?\\3\\n?',
		'g'
	);
	const negativePattern = new RegExp(
		openings +
			' ?@faber-if: ?(' +
			(condition ? `! ?${identifier}` : identifier) +
			') ?' +
			closures +
			'\\n?((.|\\n)*?)\\1 ?@faber-endif: ?\\2 ?\\3\\n?',
		'g'
	);

	return new Promise(async (resolve, reject) => {
		try {
			const resultsTrue = await replace({ files, from: positivePattern, to: '$4', countMatches: true });
			const resultsFalse = await replace({ files, from: negativePattern, to: '', countMatches: true });
			resolve([...resultsTrue, ...resultsFalse]);
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
