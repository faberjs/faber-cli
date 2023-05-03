import shell from 'shelljs';

export function cloneRepository(url, name) {
	return new Promise((resolve, reject) => {
		const gitClone = shell.exec(`git clone --depth 1 --branch master --no-checkout ${url} ${name}`, { silent: true });
		if (!gitClone.code) {
			resolve();
		} else {
			reject('Unable to clone the repository. Make sure you have the correct permissions to clone the repository.');
		}
	});
}
