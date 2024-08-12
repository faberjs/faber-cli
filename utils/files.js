import { existsSync, readFileSync } from 'fs';

export function folderExists(dir) {
	return existsSync(getAbsolutePath(dir));
}

export function getAbsolutePath(dir) {
	return `${process.env.ROOT_DIRECTORY}/${dir}`;
}

export function getRelativePath(dir, withPrefix = false) {
	const relativePath = dir.replace(`${process.env.ROOT_DIRECTORY}`, '').replace(/^\//, '');
	return withPrefix ? `./${relativePath}` : relativePath;
}

export function getFileContent(path) {
	return existsSync(getAbsolutePath(path)) ? readFileSync(getAbsolutePath(path), 'utf8') : null;
}
