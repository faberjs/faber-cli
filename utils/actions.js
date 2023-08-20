import replace from 'replace-in-file';
import { deleteAsync } from 'del';
import { moveFile } from 'move-file';
import { printMsg } from './ui.js';

export async function runActions(actions) {
	return new Promise(async (resolve, reject) => {
		try {
			if (Array.isArray(actions)) {
				let replaced = [];
				let deleted = [];
				let renamed = [];
				let moved = [];
				for (const [index, action] of actions.entries()) {
					switch (action.type) {
						case 'replace':
							try {
								const replacementsResults = await runReplacements(action.files, action.from, action.to);
								replaced = [...replaced, ...replacementsResults];
							} catch (err) {
								printMsg(`Error in the action ${index + 1} (${action.type}). ${err}`, 'error');
							}
							break;
						case 'conditional':
							try {
								const contitionalsResults = await runConditionals(
									action.files,
									action.identifier,
									action.condition
								);
								replaced = [...replaced, ...contitionalsResults];
							} catch (err) {
								printMsg(`Error in the action ${index + 1} (${action.type}). ${err}`, 'error');
							}
							break;
						case 'move':
							try {
								const movingResults = await runMoving(action.from, action.to);
								moved = movingResults;
							} catch (err) {
								printMsg(`Error in the action ${index + 1} (${action.type}). ${err}`, 'error');
							}
							break;
						case 'delete':
							try {
								const deletionsResults = await runDeletions(action.paths);
								deleted = deletionsResults;
							} catch (err) {
								printMsg(`Error in the action ${index + 1} (${action.type}). ${err}`, 'error');
							}
							break;
						default:
							break;
					}
				}
				resolve([...replaced, ...deleted, ...renamed]);
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
			const resultsTrue = await replace({ files, from: positivePattern, to: '$4' });
			const resultsFalse = await replace({ files, from: negativePattern, to: '' });
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
					await moveFile(fromPath, to[index]);
					//results.push(result);
				}
			} else {
				await moveFile(from, to);
				//results.push(result);
			}
			resolve(results);
		} catch (err) {
			reject(err);
		}
	});
}
