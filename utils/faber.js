import replace from 'replace-in-file';

export default {
	showMessage(msg) {
		console.log('Mensagem:', msg);
	},
	setActions(actions) {
		if (typeof actions === 'function') {
			this.actions = actions;
		}
	},
	setPrompts(prompts) {
		if (Array.isArray(prompts)) {
			this.prompts = prompts;
		}
	},
	/* setActions(actions) {
		// Check if actions is a function
		if(typeof actions === 'function') {

		}
	}, */
	async replace(files, from, to) {
		const results = await replace({
			files,
			from,
			to,
		});
		console.log(results);
	},
};
