import replace from 'replace-in-file';

export async function runActions(actions) {
	return new Promise(async (resolve, reject) => {
		try {
			if (Array.isArray(actions)) {
				let replaces = [];
				for (const action of actions) {
					switch (action.type) {
						case 'replace':
							const replacementsResults = await runReplacements(action.files, action.from, action.to);
							replaces = [...replaces, ...replacementsResults];
							break;
						case 'conditional':
							const contitionalsResults = await runConditionals(
								action.files,
								action.identifier,
								action.condition
							);
							replaces = [...replaces, ...contitionalsResults];
							break;

						default:
							break;
					}
				}
				resolve(replaces);
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
	const openings = `((?:\\/\\*\\*?)|(?:<!--))`;
	const closures = `((?:\\*?\\*\\/)|(?:-->))`;

	const patternTrue = new RegExp(
		openings +
			' ?@faber-if: ?(' +
			(condition ? identifier : `! ?${identifier}`) +
			') ?' +
			closures +
			'\\n?((.|\\n)*?)\\1 ?@faber-endif: ?\\2 ?\\3\\n?',
		'g'
	);
	const patternFalse = new RegExp(
		openings +
			' ?@faber-if: ?(' +
			(condition ? `! ?${identifier}` : identifier) +
			') ?' +
			closures +
			'\\n?((.|\\n)*?)\\1 ?@faber-endif: ?\\2 ?\\3\\n?',
		'g'
	);

	return new Promise(async (resolve, reject) => {
		console.log(patternTrue);
		console.log(patternFalse);
		try {
			const resultsTrue = await replace({ files, from: patternTrue, to: '$4' });
			const resultsFalse = await replace({ files, from: patternFalse, to: '' });
			resolve([...resultsTrue, ...resultsFalse]);
		} catch (err) {
			reject(err);
		}
	});
}
