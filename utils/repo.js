import shell from 'shelljs';

export function cloneRepository(url, name, branch = '') {
	return new Promise((resolve, reject) => {
		const command = shell.exec(`git clone --depth=1 --single-branch${branch ? `=${branch}` : ''} ${url} ${name}`, {
			silent: true,
		});
		if (!command.code) {
			resolve();
		} else {
			reject(command.stderr);
		}
	});
}
