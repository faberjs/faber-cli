import { existsSync } from 'fs';
import { getRelativePath } from './path.js';

export function folderExists(dir) {
	return existsSync(getRelativePath(dir));
}
