import { existsSync, readFileSync } from 'fs';

export function folderExists(dir) {
	return existsSync(getRelativePath(dir));
}

export function getRelativePath(dir) {
	return `${process.cwd()}/${dir}`;
}

export function getFileContent(path) {
	return existsSync(getRelativePath(path)) ? readFileSync(getRelativePath(path), 'utf8') : null;
}
