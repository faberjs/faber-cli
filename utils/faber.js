export default {
	setActions(actions) {
		if (typeof actions === 'function') {
			this.actions = actions;
		}
	},
	/* setPrompts(prompts) {
		if (Array.isArray(prompts)) {
			this.prompts = prompts;
		}
	}, */
};
