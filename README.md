# Faber CLI

This is a CLI to help creating new projects using pre-configured boilerplates.

You can **prepare your own boilerplates** to make them configurable for creating new projects, and use the CLI to **start new projects** with these pre-configured boilerplates whenever needed.

## Requirements

To use the Faber CLI you will need:

-  [Node.js](https://nodejs.org/) - JavaScript runtime environment
-  [NPM](https://www.npmjs.com/) – JavaScript dependencies manager

## Getting Started

To use Faber CLI in a boilerplate, you need to create a `faberconfig.js` file at the root of your boilerplate project.

Usaully, this file uses the `.js` extension, but depending on your preferences and your project settings (`package.json`, if existing on the project's root) you might want to use a different extension.

To use _CommonJS_, the file must be either:

-  `.js` with `type: "commonjs"` in your `package.json`.
-  `.cjs` with any `type` in your `package.json`.
-  `.js` without having a `package.json` in the root.

To use _ESM_, the file must be eihter:

-  `.js` with `type: "module"` in your `package.json`.
-  `.mjs` with any `type` in your `package.json`.

### Configuring `faberconfig`

See below a basic example for usign _CommonJS_ or _ESM_.

#### CommonJS

```js
module.exports = function (faber) {
	faber.setActions((data) => {
		return [
			// Add your actions here
			// ...
		];
	});
};
```

#### ESM

```js
export default (faber) => {
	faber.setActions((data) => {
		return [
			// Add your actions here
			// ...
		];
	});
};
```

## Commands (CLI)

The CLI has commands to **create** new projects, **test** boilerplates, and also **manage** available repository aliases on your local machine.

In a nutshell, you will use:

-  `faber create` – To create new projects from a pre-configured boilerplate. This command **clones the repo**, and then execute the `faber run` command inside it.
-  `faber run` – To execute the configured actions on an boilerplate. When working on the boilerplate actions, you can use this command to test the actions you are developing.
-  `faber ls|add|rm` – To manage aliases to your boilerplates for ease of usage when using the `faber create` command.

### `faber create`

Creates a new project with a pre-configured boilerplate.

#### Usage example

```shell
$ faber create my-project --simulate --keep-git --use-existing
```

#### Flags (optional)

-  `--dry` – Simulate the actions without making any changes. (_DRY_ stands for **_Don't Run Yet_**).
-  `--keep-git` – Prevent removal of the .git folder. Useful to check what has changed on the original boilerplate using git tools.
-  `--use-existing` – Skip the prompt to use existing folder. Useful when working on a boilerplate.

#### What it does?

1. Clones the boilerplate repository into a new folder with the provided name.
2. Run the steps from the `faber run` command.
3. Deletes the `.git` folder from the repository (when not using the `--keep-git` flag);

> **Notice**: You need to have permission to read from the boilerplate repository. When using private repositories, you need to authenticate via SSH or HTTPS as normally.

### `faber run`

Run the configured actions on the current directory. Useful for development.

> A `faberconfig` file should be present on the directory.

#### Usage example

```shell
$ faber run --dry --data --no-preview
```

#### Flags (optional)

-  `--dry` – Simulate the actions without making any changes. (_DRY_ stands for **_Don't Run Yet_**).
-  `--data` – Encoded JSON data to be passed to the script.
-  `--no-preview` – Do not show the JSON data preview.
-  `--no-results` – Do not show the actions results.

#### What it does?

1. Read the `faberconfig` file from the directory;
2. Ask for the **encoded JSON data** to pass to the boilerplate (when not privided with the `--data` flag);
3. Display a **preview of the data** (when not using the `--no-preview` flag);
4. Execute the **actions** from `faberconfig` (when not using the `--dry` flag);

### `faber ls`

List your registered boilerplates.

#### Usage example

```shell
$ faber ls
```

### `faber add`

Adds a boilerplate to your list of available boilerplates.

#### Usage example

```shell
$ faber add my-boilerplate git@github.com:example.git 'My Boilerplate'
```

#### Arguments

`faber add <alias> <repository> [name]`

-  `<alias>` (_mandatory_) – Used to reference this boilerplate on other commands. It should consist only of letters, numbers, dashes and underscores.
-  `<repository>` (_mandatory_) – URL to **clone** the repository. It usually ends with `.git`.
-  `[name]` (_optional_) – A name for this boilerplate to display when using the `faber create` command.

### `faber rm`

Removes a boilerplate from your list of available boilerplates.

#### Usage example

```shell
$ faber rm my-boilerplate
```

#### Arguments

`faber rm <alias>`

-  `<alias>` (_mandatory_) – The reference to the boilerpolate to remove from your list.

## Actions

Actions are defined on the `faberconfig` file of the boilerplate using the `faber.setActions()` function.

You can use the **project's data** from the provided JSON (requested at `faber create` or `faber run` commands) on any action.

See below the available actions that you can use:

### Replace

Replaces text or patterns on files or glob patterns.

| Property | Type                              | Required | Description                                                                                               |
| -------- | --------------------------------- | -------- | --------------------------------------------------------------------------------------------------------- |
| `type`   | _String_                          | Yes      | Should be `'replace'` for this action.                                                                    |
| `files`  | _String,[String]_                 | Yes      | Path to the files where the replace should happen. It can be an array of paths, and can use glob pattern. |
| `from`   | _String,[String],RegExp,[RegExp]_ | Yes      | Text(s) or pattern(s) to look for in the `files`.                                                         |
| `to`     | _String,[String],RegExp,[RegExp]_ | Yes      | The replacement text(s). If array is provided, should match the same length as the `from` array.          |

#### Usage examples

```js
faber.setActions((data) => {
	return [
		// Replace first occurrence of a string in single file.
		{
			type: 'replace',
			files: 'README.md',
			from: 'PROJECT_NAME',
			to: data.projectName,
		},
		// Replace all occurrences of multiple strings
		// in multiple files, also using glob patterns.
		{
			type: 'replace',
			files: ['README.md', 'package.json', 'src/*'],
			from: [/AUTHOR_NAME/g, /AUTHOR_URI/g],
			to: [data.authorName, data.authorUri],
		},
	];
});
```

#### Considerations

-  By default, the `.replace()` function on JavaScript replaces only the **first occurrence** of a searched string. To replace all occurrences you should use a regex pattern with the global flag (like `/something/g`).
-  This action uses the [replace-in-file](https://www.npmjs.com/package/replace-in-file) package for the replacements. Please visit its documentation if needed.

### Delete

Deletes files or entire folders by defined paths or glob patterns.

| Property | Type              | Required | Description                                                             |
| -------- | ----------------- | -------- | ----------------------------------------------------------------------- |
| `type`   | _String_          | Yes      | Should be `'delete'` for this action.                                   |
| `paths`  | _String,[String]_ | Yes      | Paths to the files or folders to delete. Also supporting glob patterns. |

#### Usage examples

```js
faber.setActions((data) => {
	return [
		// Delete a single file
		{
			type: 'delete',
			files: 'file.txt',
		},
		// Delete files and folders using glob patterns
		{
			type: 'delete',
			files: ['**/*.txt', 'path/to/folder'],
		},
	];
});
```

#### Considerations

-  If the file/folder doesn't exist, it's just ignored.
-  This action uses the [del](https://www.npmjs.com/package/del) package for deleting files/folders. Please visit its documentation if needed.

### Move (or Rename)

Can be used to move or rename files and folders.

| Property | Type              | Required | Description                                                    |
| -------- | ----------------- | -------- | -------------------------------------------------------------- |
| `type`   | _String_          | Yes      | Should be `'move'` for this action.                            |
| `from`   | _String,[String]_ | Yes      | Path(s) to the source files or folders to move.                |
| `to`     | _String,[String]_ | Yes      | Destination path(s) to the files or folders to move or rename. |

#### Usage examples

```js
faber.setActions((data) => {
	return [
		// Move a single file to another directory
		{
			type: 'move',
			from: 'file.txt',
			to: 'folder/file.txt',
		},
		// Rename a folder and move and rename a file
		{
			type: 'move',
			from: ['folder', 'file.txt'],
			to: ['dir', 'dir/renamed-file.txt'],
		},
	];
});
```

#### Considerations

-  When moving a file to another directory, if the destination (`to`) directory doesn't exist yet, it is created automatically.
-  If a file/folder with the destination (`to`) name already exists, the existing one will be **overriden**.
-  If the source (`from`) file/folder doesn't exist, an **error** is thrown.
-  This action uses the [move-file](https://www.npmjs.com/package/move-file) package for renaming files. Please visit its documentation if needed.

### Conditionals

Update files' content based on conditional rules. Useful to keep/remove text according to conditions with the provided data.

| Property     | Type              | Required | Description                                                                                                                                                                                      |
| ------------ | ----------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `type`       | _String_          | Yes      | Should be `'conditional'` for this action.                                                                                                                                                       |
| `files`      | _String,[String]_ | Yes      | Path to the files where the conditional updates should happen. It can be an array of paths.                                                                                                      |
| `identifier` | _String_          | Yes      | A token to identify the content to be kept/removed.                                                                                                                                              |
| `condition`  | _Boolean_         | Yes      | The condition to keep/remove the content. When the condition is `true`, the block is kept. However, when the block uses a negative token (`!`), the block is kept when the condition is `false`. |

#### Usage examples

```js
faber.setActions((data) => {
	return [
		// Keep/Remove content on single file
		{
			type: 'conditional',
			files: 'file.txt',
			identifier: 'is-multilanguage',
			condition: data.isMultiLanguage,
		},
	];
});
```

On the file content, you can wrap the block of content to keep/remove with **Faber conditional comments**.

Here are some examples:

```markdown
This is a file with instruction of the project.

<!-- @faber-if: is-multilanguage -->

This line is only added if the condition is true.

<!-- @faber-endif: is-multilanguage -->

This is /_ @faber-if: !is-multisite _/not /_ @faber-endif: !is-multisite _/a multi language project.
```

In the above example, the line between the `@faber-if` and `@faber-endif` HTML comments is kept when the condition to the `is-multilanguage` identifier is `true`.

In the last line however, it keeps the `“not”` word when the condition is `false`, using another commenting style (but could be the same style).

#### Considerations

-  Currently, the only supported commenting styles are block comments like `<!-- -->` and `/* */`:
-  The comments should start with `@faber-if:` (for the beginning) and `@faber-endif:` (for the end).
-  The identifier is **required** for both `@faber-if` and `@faber-endif` to the action to work correctly.

### Run

Execute shell commands.

| Property   | Type              | Required | Description                                                                                  |
| ---------- | ----------------- | -------- | -------------------------------------------------------------------------------------------- |
| `type`     | _String_          | Yes      | Should be `'run'` for this action.                                                           |
| `commands` | _String,[String]_ | Yes      | Command(s) to execute sequentially.                                                          |
| `silent`   | _Boolean_         | No       | If `false`, logs the command(s) output on the console. Default is `true` (omits the output). |

#### Usage examples

```js
faber.setActions((data) => {
	return [
		// Executes a single command
		{
			type: 'run',
			files: 'echo "Hello World!"',
		},
		// Executes multiple commands
		{
			type: 'run',
			files: ['npm i', 'npm run start'],
		},
		// Same as above, but using command separators
		{
			type: 'run',
			files: 'npm i && npm run start', // or 'npm i; npm run start'
		},
	];
});
```

#### Considerations

-  Using **command separators** (`&&` or `;`) has the exact same behavior as using an array with multiple commands. It's just a matter of preference.
-  This action uses the `exec()` function from the [shelljs](https://www.npmjs.com/package/shelljs) library for executing the commands.

## Mentions

This documentation was highly inspired by the [Plop](https://plopjs.com/) documentation.

_Plop_ is an amazing framework with a similar goal as _Faber_, however, while _Plop_ is amazing for generating code inside your project, _Faber_ is fully focused on starting new projects. (_P.S. You can use both together in your boilerplate_ 😉)
