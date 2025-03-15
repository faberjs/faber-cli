import Joi from 'joi';

/**
 * Validates the actions' objects.
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
