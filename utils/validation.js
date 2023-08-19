/**
 * Check if a value is of a specific type (or types).
 *
 * @param {any} value The value to validate the type.
 * @param {string} types The type(s) to validate against. Separate multiple types with a pipe (|).
 */
export function isOfType(value, types = '') {
	types.split('|').forEach((type) => {
		if (typeof value === type) {
			return true;
		}
	});

	return false;
}
