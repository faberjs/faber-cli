/**
 * Returns an escaped string for use in a regular expression.
 *
 * @param {string} string The string to escape.
 */
export function escapeRegExp(string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

/**
 * Add optional space around the given regular expression.
 *
 * @param {string} expression The regular expression string to add optional space around.
 */
export function optionalSpaceAround(expression) {
	return `[ \t]*${expression}[ \t]*`;
}

/**
 * Add optional space before the given regular expression.
 *
 * @param {string} expression The regular expression string to add optional space before.
 */
export function optionalSpaceBefore(expression) {
	return `[ \t]*${expression}`;
}

/**
 * Add optional space after the given regular expression.
 *
 * @param {string} expression The regular expression string to add optional space after.
 */
export function optionalSpaceAfter(expression) {
	return `${expression}[ \t]*`;
}

/**
 * Generate positive and negative patterns for conditional comments for each commenting structure.
 *
 * @param {string} identifier The identifier to use in the conditional comments
 * @param {string} condition The condition to use for positive and negative matches
 * @returns {object} An object containing positive and negative patterns for conditional comments
 */
export function getConditionalCommentPatterns(identifier, condition) {
	const commentingPatterns = [
		[`\\/\\*\\*?`, `\\*\\/\\n?`],
		[`<!--`, `-->\\n?`],
		[`'''`, `'''\\n?`],
		[`"""`, `"""\\n?`],
		[`///?`, `(?:\\n|$)`],
		[`#`, `(?:\\n|$)`],
	];

	const positivePatterns = [];
	const negativePatterns = [];

	for (const [open, close] of commentingPatterns) {
		positivePatterns.push(
			new RegExp(
				[
					open,
					optionalSpaceAround('@faber-if:'),
					condition ? identifier : `!${optionalSpaceBefore(identifier)}`,
					optionalSpaceBefore(close),
					'((.|\\n)*?)',
					open,
					optionalSpaceAround('@faber-endif:'),
					condition ? identifier : `!${optionalSpaceBefore(identifier)}`,
					optionalSpaceBefore(close),
				].join(''),
				'g'
			)
		);

		negativePatterns.push(
			new RegExp(
				[
					open,
					optionalSpaceAround('@faber-if:'),
					condition ? `!${optionalSpaceBefore(identifier)}` : identifier,
					optionalSpaceBefore(close),
					'(?<content>(.|\\n)*?)',
					open,
					optionalSpaceAround('@faber-endif:'),
					condition ? `!${optionalSpaceBefore(identifier)}` : identifier,
					optionalSpaceBefore(close),
				].join(''),
				'g'
			)
		);
	}

	return {
		positivePatterns,
		negativePatterns,
	};
}
