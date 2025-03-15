import { existsSync, readFileSync } from 'fs';

export function folderExists(dir) {
	return existsSync(getAbsolutePath(dir));
}

export function getAbsolutePath(dir) {
	return `${process.cwd()}/${dir}`;
}

export function getRelativePath(dir) {
	return dir.replace(`${process.cwd()}/`, '');
}

export function getFileContent(path) {
	return existsSync(getAbsolutePath(path)) ? readFileSync(getAbsolutePath(path), 'utf8') : null;
}
