export default {
	setActions(actions) {
		if (typeof actions === 'function') {
			this.actions = actions;
		}
	},
};
