# Faber CLI

This is a CLI to help creating new projects using pre-configured boilerplates.

You can **prepare your own boilerplates** to make them configurable for creating new projects, and use the CLI to **start new projects** with these pre-configured boilerplates whenever needed.

## Requirements

To use the Faber CLI you will need:

-  [Node.js](https://nodejs.org/) - JavaScript runtime environment
-  [NPM](https://www.npmjs.com/) – JavaScript dependencies manager

## Commands

The CLI has commands to **create** new projects, **test** boilerplates, and also **manage** available repository aliases on your local machine.

In a nutshell, you will use:

-  `faber create` – To create new projects from a pre-configured boilerplate. This command **clones the repo**, and then run the `faber execute` command inside it.
-  `faber execute` – To execute the configured actions on an boilerplate. When working on the boilerplate actions, you can use this command to test the actions you are developing.
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
2. Run the steps from the `faber execute` command.
3. Deletes the `.git` folder from the repository (when not using the `--keep-git` flag);

> **Notice**: You need to have permission to read from the boilerplate repository. When using private repositories, you need to authenticate via SSH or HTTPS as normally.

### `faber execute`

Execute the configured actions on the current directory. Useful for development.

> A `faberconfig` file should be present on the directory.

#### Usage example

```shell
$ faber execute --dry --data --no-preview
```

#### Flags (optional)

-  `--dry` – Simulate the actions without making any changes. (_DRY_ stands for **_Don't Run Yet_**).
-  `--data` – Encoded JSON data to be passed to the script.
-  `--no-preview` – Do not show the JSON data preview.

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

You can use the **project's data** from the provided JSON (requested at `faber create` or `faber execute` commands) on any action.

See below the available actions that you can use:

### Replace

Replaces text or patterns on files.

| Property | Type                              | Description                                                                                               |
| -------- | --------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `type`   | _String_                          | Should be `'replace'` for this action.                                                                    |
| `files`  | _String,[String]_                 | Path to the files where the replace should happen. It can be an array of paths, and can use glob pattern. |
| `from`   | _String,[String],RegExp,[RegExp]_ | Text(s) or pattern(s) to look for in the `files`.                                                         |
| `to`     | _String,[String],RegExp,[RegExp]_ | The replacement text(s). If array is provided, should match the same length as the `from` array.          |

#### Usage examples

```js
faber.setActions((data) => {
	return [
		// Replace first occurrence of a string in single file
		{
			type: 'replace',
			files: 'README.md',
			from: 'PROJECT_NAME',
			to: data.projectName,
		},
		// Replace all occurrences of multiple strings in multiple files using glob patterns
		{
			type: 'replace',
			files: ['README.md', 'package.json', 'src/*'],
			from: [/AUTHOR_NAME/g, /AUTHOR_URI/g],
			to: [data.authorName, data.authorUri],
		},
	];
});
```

> **Notice**: By default, the `.replace()` function on JavaScript replaces only the **first occurrence** of a searched string. To replace all occurrences you should use a regex pattern with the global flag (like `/something/g`).

This action uses the [replace-in-file](https://www.npmjs.com/package/replace-in-file) package for the replacements. For more usage details visit its [official documentation](https://github.com/adamreisnz/replace-in-file#advanced-usage).
