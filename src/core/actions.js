import replace from 'replace-in-file';
import fs from 'fs';
import shell from 'shelljs';
import colors from 'colors';
import { deleteAsync } from 'del';
import { moveFile } from 'move-file';
import { getRelativePath, getAbsolutePath } from '../utils/files.js';
import { printMsg } from '../utils/ui.js';
import { getConditionalCommentPatterns } from '../utils/regex.js';

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
									`On action [${colors.cyan(
										index + 1
									)}] (of type \`${colors.cyan(
										action.type
									)}\`). ${err}`
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
									`On action [${colors.cyan(
										index + 1
									)}] (of type \`${colors.cyan(
										action.type
									)}\`). ${err}`
								);
							}
							break;
						case 'move':
							try {
								const movingResults = await runMoving(
									action.from,
									action.to
								);
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
									`On action [${colors.cyan(
										index + 1
									)}] (of type \`${colors.cyan(
										action.type
									)}\`). ${err}`
								);
							}
							break;
						case 'delete':
							try {
								const deletionsResults = await runDeletions(
									action.paths
								);
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
									`On action [${colors.cyan(
										index + 1
									)}] (of type \`${colors.cyan(
										action.type
									)}\`). ${err}`
								);
							}
							break;
						case 'run':
							try {
								const commandsResults = await runCommands(
									action.command,
									action.silent
								);
								results = results.concat(
									commandsResults.map((executed) => {
										return {
											action: index + 1,
											type: action.type,
											command: executed.command,
											result: executed.result,
											dir: getRelativePath(executed.dir, true),
										};
									})
								);
							} catch (err) {
								reject(
									`On action [${colors.cyan(
										index + 1
									)}] (of type \`${colors.cyan(
										action.type
									)}\`). ${err}`
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
	const { positivePatterns, negativePatterns } = getConditionalCommentPatterns(
		identifier,
		condition
	);

	return new Promise(async (resolve, reject) => {
		try {
			let results = [];
			for (const positivePattern of positivePatterns) {
				const res = await replace({
					files,
					from: positivePattern,
					to: '$1',
					countMatches: true,
					ignore,
				});
				results = [...results, ...res];
			}
			for (const negativePattern of negativePatterns) {
				const res = await replace({
					files,
					from: negativePattern,
					to: '',
					countMatches: true,
					ignore,
				});
				results = [...results, ...res];
			}
			let uniqueResults = results.reduce((acc, res) => {
				if (acc[res.file]) {
					acc[res.file].numReplacements += res.numReplacements;
					acc[res.file].numMatches += res.numMatches;
					acc[res.file].hasChanged =
						acc[res.file].hasChanged || res.hasChanged;
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
			if (
				Array.isArray(from) &&
				Array.isArray(to) &&
				from.length === to.length
			) {
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
					printMsg(
						`Running command: ${colors.magenta(command)}`,
						'muted',
						'$'
					);
				}
				const workingDir = shell.pwd();
				const shellResults = /^cd /.test(command)
					? await shell.cd(command.replace('cd ', ''))
					: await shell.exec(command, { silent });
				if (shellResults.code === 0) {
					results.push({
						command,
						dir: workingDir,
						result: {
							code: shellResults.code,
							stdout: shellResults.stdout,
							stderr: shellResults.stderr,
						},
					});
				} else {
					await returnToRootDirectory();
					reject(shellResults.stderr);
				}
			}

			await returnToRootDirectory();
			resolve(results);
		} catch (err) {
			reject(err);
		}
	});
}

async function returnToRootDirectory() {
	shell.cd(process.env.ROOT_DIRECTORY);
}
