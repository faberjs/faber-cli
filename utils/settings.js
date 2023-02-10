import { directory as homeDir } from 'home-dir';
import fs from 'fs';

const configFile = `${homeDir}/.faberconfig`;

export async function getConfig() {
	if (!fs.existsSync(configFile)) return {};
	return JSON.parse(fs.readFileSync(configFile, 'utf8'));
}

export async function updateConfig(data) {
	fs.writeFileSync(configFile, JSON.stringify(data, null, '\t'));
}

export async function getBoilerplates() {
	const settings = await getConfig();
	return settings.hasOwnProperty('boilerplates') ? settings.boilerplates : [];
}

export async function addBoilerplate(data) {
	const settings = await getConfig();
	settings.hasOwnProperty('boilerplates') ? settings.boilerplates.push(data) : (settings.boilerplates = [data]);
	await updateConfig(settings);
}

export async function removeBoilerplate(alias) {
	const settings = await getConfig();
	settings.boilerplates = settings.boilerplates.filter((boilerplate) => boilerplate.alias !== alias);
	await updateConfig(settings);
}

export async function updateBoilerplate(alias, newData) {
	const settings = await getConfig();
	settings.boilerplates = settings.boilerplates.map((boilerplate) => {
		return boilerplate.alias === alias ? { ...newData } : boilerplate;
	});
	await updateConfig(settings);
}
