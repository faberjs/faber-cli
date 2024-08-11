import { directory as homeDir } from 'home-dir';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const settingsFilePath = `${homeDir}/.fabersettings.json`;

export async function getSettings() {
	if (!existsSync(settingsFilePath)) return {};
	return JSON.parse(readFileSync(settingsFilePath, 'utf8'));
}

export async function updateSettings(data) {
	writeFileSync(settingsFilePath, JSON.stringify(data, null, '\t'));
}

export async function getBoilerplates() {
	const settings = await getSettings();
	return settings.hasOwnProperty('boilerplates') ? settings.boilerplates : [];
}

export async function addBoilerplate(data) {
	const settings = await getSettings();
	settings.hasOwnProperty('boilerplates') ? settings.boilerplates.push(data) : (settings.boilerplates = [data]);
	await updateSettings(settings);
}

export async function removeBoilerplate(alias) {
	const settings = await getSettings();
	settings.boilerplates = settings.boilerplates.filter((boilerplate) => boilerplate.alias !== alias);
	await updateSettings(settings);
}

export async function updateBoilerplate(alias, newData) {
	const settings = await getSettings();
	settings.boilerplates = settings.boilerplates.map((boilerplate) => {
		return boilerplate.alias === alias ? { ...newData } : boilerplate;
	});
	await updateSettings(settings);
}
