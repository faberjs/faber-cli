/**
 * Return object from a minified or encoded JSON string.
 *
 * @param {string} json The minified or base64 encoded JSON string.
 * @returns {object} The decoded JSON object, or false if an error occurs.
 */
export function parseJsonData(json) {
	if (!json) {
		return {};
	}
	// Check if the input is a valid JSON string, if not, try to decode it
	try {
		return JSON.parse(json);
	} catch (error) {
		try {
			const decoded = Buffer.from(json, 'base64').toString('utf8');
			return JSON.parse(decoded);
		} catch (error) {
			throw new Error(error);
		}
	}
}

export function endOfJson(json, length = 10) {
	return json.length > length ? `…${json.slice(-length)}` : json;
}
