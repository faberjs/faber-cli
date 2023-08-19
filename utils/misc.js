/**
 * Returns an escaped string for use in a regular expression.
 *
 * @param {string} string The string to escape.
 */
export function escapeRegExp(string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
