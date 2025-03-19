# Faber CLI

Faber is a CLI that helps you create/scaffold new projects using custom boilerplates.

You can **prepare your own boilerplates** to make them configurable for creating new projects with Faber, and pass custom parameters, data or actions to execute in the scaffolding of your new project.

## Summary

- [Getting Started](#getting-started)
  - [Requirements](#requirements)
  - [Demo](#demo)
  - [Installation](#installation)
  - [Usage](#usage)
  - [Configuring](#configuring-faberconfig)
- [Passing Data](#passing-data)
  - [Encoded JSON (recommended)](#encoded-json-recommended)
  - [Minified JSON](#minified-json-less-reliable)
  - [Reserved Properties](#reserved-properties)
- [Actions](#actions)
  - [Replace](#replace)
  - [Move (or Rename)](#move-or-rename)
  - [Delete](#delete)
  - [Conditional](#conditional)
  - [Run](#run)
- [Commands (CLI)](#commands-cli)
  - [Execute](#faber-execute)
  - [Create](#faber-create)
  - [List](#faber-ls)
  - [Add](#faber-add)
  - [Remove](#faber-rm)

## Getting Started

### Requirements

To use the Faber CLI, you will need [Node.js](https://nodejs.org/) and [NPM](https://www.npmjs.com/) on your machine.

Your project **doesn't need** to use Node.js for you to use Faber with it. You can use it on boilerplates with any kind of framework or stack. Once the project is created, Faber's work is done.

However, for being a JS library, Faber configurations are currently written with **JavaScript**.

### Installation

Install the CLI globally on your machine with:

```shell
npm install -g faber-cli
```

### Demo

For having a quick demonstration of how Faber is used, try the [faber-demo](https://github.com/faberjs/faber-demo) example repository.

### Usage

Before diving into details, here is a quick overview of how you can use Faber on your projects:

If you want to **prepare a boilerplate** for using Faber:

1. Create a [faberconfig](#configuring-faberconfig) file at the root of your boilerplate repository;
2. Write the [actions](#actions) to be executed on the boilerplate when creating a new project with it;
3. Prepare the [data](#passing-data) you want to use in your actions;
4. Test your actions with the [`faber execute`](#faber-execute) CLI command.

If you want to **use an existing boilerplate** to create a new project:

1. Prepare the [data](#passing-data) you want to use for your project as a minified JSON;
2. Choose a repository of a boilerplate to use as a template;
3. Use the [`faber create`](#faber-create) CLI command to bootstrap a new project.

### Configuring `faberconfig`

To use Faber CLI in a boilerplate, you need to create a `faberconfig.js` file at the root of your boilerplate project.

Usually, this file uses the `.js` extension, but depending on your preferences and your project settings (`package.json`, if existing on the project's root) you might want to use a different extension.

To use _CommonJS_, the file must be either:

- `.js` with `type: "commonjs"` in your `package.json`;
- `.cjs` with any `type` in your `package.json`.
- `.js` without having a `package.json` in the root;

To use _ESM_, the file must be either:

- `.js` with `type: "module"` in your `package.json`;
- `.mjs` with any `type` in your `package.json`.

See below a basic example using _CommonJS_ and _ESM_.

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

## Passing Data

During the `faber create` and `faber execute` commands, the CLI asks for a minified (optionally encoded) JSON data. This data is passed to the `setActions()` function, allowing you to use it in the actions.

Here is an example of JSON data:

```json
{
  "name": "My Project",
  "client": "The Client",
  "isMultilanguage": false
}
```

Due to the nature of how terminals (command prompts) work, there are some limitations on how to pass the data to the CLI. See below how to do it properly.

### Encoded JSON (recommended)

The most reliable way of passing data is using a **Base64 encoded** JSON. Encoding guarantees the content consistency while working with any method of passing data to Faber.

You can encode the JSON to [Base64](https://en.wikipedia.org/wiki/Base64) how you prefer, or use our online [JSON encoder](https://www.faberjs.com/json-encoder/) that works seamlessly with Faber.

Here is an example of a Base64 encoded JSON:

```
eyJuYW1lIjoiTXkgUHJvamVjdCIsImNsaWVudCI6IlRoZSBDbGllbnQiLCJpc011bHRpbGFuZ3VhZ2UiOmZhbHNlfQ==
```

> **Tip**: Minifying the JSON before encoding it helps generate a smaller string.

### Minified JSON (less reliable)

Although we encourage using the encoding approach, you can also pass a **minified** JSON directly. It might be easier than encoding depending on your workflow, but has some caveats:

#### When asked by CLI

By default, the CLI will prompt you to paste the JSON data during its execution.

If not encoded, the JSON can be passed directly, as long as it **does not contain line breaks**, as in the example below:

```shell
$ Paste the project data: {"name":"My Project","client":"The Client","isMultilanguage":false}
```

> You can also use our online [JSON encoder](https://www.faberjs.com/json-encoder/) to minify it without encoding.

#### Using `--data` argument

If you prefer to pass the data directly in the terminal via command, you can use the `--data` argument, passing the JSON as value.

In this case, if not encoded, the JSON must be **minified** and then **stringified**.

However, some terminals might **misinterpret JSONs that include spaces**, or ignore **escaped characters**, which would break the JSON anyway. To avoid this, encoding would be a more reliable option.

Here is a usage example (this might or not work depending on your system):

```shell
faber create my-project --data "{\"name\":\"My Project\",\"client\":\"The Client\",\"isMultilanguage\":false}"
```

> You can use an online tool like **jsonformatter.org** to [stringify](https://jsonformatter.org/json-stringify-online) the JSON after minifying it.

### Reserved Properties

When using the `create` task, the name of the project passed as an argument for the command (i.e. `faber create my-project`) is added to the data object as the `_dirName` parameter. Similarly, when using the `execute` task, it gets the name of the folder where you are running the command.

```js
{
  _dirName: 'my-project';
}
```

## Actions

Actions are defined on the `faberconfig` file of the boilerplate using the `faber.setActions()` function.

You can use the **project's data** from the provided JSON (requested at `faber create` or `faber execute` commands) on any action.

See below the available actions that you can use:

### Replace

Replaces text or patterns on files or glob patterns.

| Property | Type                              | Required | Description                                                                                                   |
| -------- | --------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------- |
| `type`   | _String_                          | Yes      | Should be `'replace'` for this action.                                                                        |
| `files`  | _String,[String]_                 | Yes      | Path to the files where the replace should happen. It can be an array of paths, and can use glob patterns.    |
| `ignore` | _String,[String]_                 | No       | Path to the files where the replace shouldn't happen. It can be an array of paths, and can use glob patterns. |
| `from`   | _String,[String],RegExp,[RegExp]_ | Yes      | Text(s) or pattern(s) to look for in the `files`.                                                             |
| `to`     | _String,[String],RegExp,[RegExp]_ | Yes      | The replacement text(s). If array is provided, should match the same length as the `from` array.              |

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
    // in multiple files, using glob patterns,
    // and defining paths not to change.
    {
      type: 'replace',
      files: ['README.md', 'package.json', 'src/*'],
      ignore: ['src/node_modules', '.git'],
      from: [/AUTHOR_NAME/g, /AUTHOR_URI/g],
      to: [data.authorName, data.authorUri],
    },
  ];
});
```

#### Considerations

- By default, the `.replace()` function on JavaScript replaces only the **first occurrence** of a searched string. To replace all occurrences you should use a regular expression with the global flag (like `/something/g`).
- Consider using **regex boundaries** for more precise replacements, like `/\bNAME\b/g`. This prevents matching strings like `COAUTHOR` when looking for just `AUTHOR`.
- This action uses the [replace-in-file](https://www.npmjs.com/package/replace-in-file) package for the replacements. For more details about the `from`, `to` and `ignore` parameters, please visit its documentation.

### Move (or Rename)

Can be used to move or rename files and folders.

| Property | Type              | Required | Description                                                                                                                            |
| -------- | ----------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `type`   | _String_          | Yes      | Should be `'move'` for this action.                                                                                                    |
| `from`   | _String,[String]_ | Yes      | Path(s) to the source files or folders to move.                                                                                        |
| `to`     | _String,[String]_ | Yes      | Destination path(s) to the files or folders to move or rename. If array is provided, should match the same length as the `from` array. |

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
      to: [data.newFolderName, `dir/${data.newFileName}`],
    },
  ];
});
```

#### Considerations

- When moving a file to another directory, if the destination (`to`) directory doesn't exist yet, it is created automatically.
- If a file/folder with the destination (`to`) name already exists, the existing one will be **overriden**.
- If the source (`from`) file/folder doesn't exist, an **error** is thrown.
- This action uses the [move-file](https://www.npmjs.com/package/move-file) package for moving/renaming files. Please visit its documentation if needed.

### Delete

Deletes files or entire folders by defined paths or glob patterns.

| Property | Type              | Required | Description                                                                                     |
| -------- | ----------------- | -------- | ----------------------------------------------------------------------------------------------- |
| `type`   | _String_          | Yes      | Should be `'delete'` for this action.                                                           |
| `paths`  | _String,[String]_ | Yes      | Path to the files or folders to delete. It can be an array of paths, and can use glob patterns. |

#### Usage examples

```js
faber.setActions((data) => {
  return [
    // Delete a single file
    {
      type: 'delete',
      files: 'file.txt',
    },
    // Delete files and folders using glob pattern and variable
    {
      type: 'delete',
      files: ['**/*.txt', data.folderToDelete],
    },
  ];
});
```

#### Considerations

- If the file/folder doesn't exist, it's just ignored.
- This action uses the [del](https://www.npmjs.com/package/del) package for deleting files/folders. Please visit its documentation if needed.

### Conditional

Update files' content based on conditional rules. Useful to keep/remove text according to conditions and the provided data.

| Property     | Type              | Required | Description                                                                                                                                                                                                                                           |
| ------------ | ----------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`       | _String_          | Yes      | Should be `'conditional'` for this action.                                                                                                                                                                                                            |
| `files`      | _String,[String]_ | Yes      | Path to the files where the conditional updates should happen. It can be an array of paths.                                                                                                                                                           |
| `ignore`     | _String,[String]_ | No       | Path to the files where the replace shouldn't happen. It can be an array of paths, and can use glob pattern.                                                                                                                                          |
| `identifier` | _String_          | Yes      | A token to identify the content to be kept/removed.                                                                                                                                                                                                   |
| `condition`  | _Boolean_         | Yes      | The condition to keep/remove the content. When the condition is `true`, the content is kept, and removed when `false`. However, when the block uses a negative token (`!`), the block is kept when the condition is `false`, and removed when `true`. |

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

```html
This is a file with instructions of the project.

<!-- @faber-if: is-multilanguage -->
This paragraph is only kept if the condition is truthy.

<!-- @faber-endif: is-multilanguage -->
```

In the above example, the 2 lines between the `@faber-if` and `@faber-endif` HTML comments are **kept** when the condition to the `is-multilanguage` identifier is `true`, and **deleted** when the condition is `false`.

#### Negative match

```css
This prints the /* @faber-if: !is-multisite */not /* @faber-endif: !is-multisite */word if the condition is falsy.
```

In this example, by prefixing the identifier with an exclamation mark (`!`), we invert the rule, **keeping** the `not` word when the condition is `false` and **deleting** it when `true`.

#### Supported comments

Currently, you can use the following commenting styles for conditional replacements:

- Block comments:
  - `<!--` `-->`
  - `/**` `*/`
  - `/*` `*/`
  - `'''` `'''`
  - `"""` `"""`
- Line comments:
  - `//`
  - `///`
  - `#`

#### Considerations

- The conditional content is everything between the `@faber-if: identifier` and `@faber-endif: identifier` comments;
- The identifier is **required** for both `@faber-if` and `@faber-endif` for the action to work correctly;
- There is no `@faber-else` logic yet;
- The identifier is **not a variable**, it's just a string that links the conditional blocks to the configured action;
- You can have multiple conditional blocks using the **same identifier**;
- Prefix the identifier with an exclamation mark `!` to keep the block when the condition is `false` instead of `true`;

### Run

Run shell commands.

| Property   | Type              | Required | Description                                                                                  |
| ---------- | ----------------- | -------- | -------------------------------------------------------------------------------------------- |
| `type`     | _String_          | Yes      | Should be `'run'` for this action.                                                           |
| `commands` | _String,[String]_ | Yes      | Command(s) to run sequentially.                                                              |
| `silent`   | _Boolean_         | No       | If `false`, logs the command(s) output on the console. Default is `true` (omits the output). |

#### Usage examples

```js
faber.setActions((data) => {
  return [
    // Runs a single command
    {
      type: 'run',
      command: 'mkdir testing',
    },
    // Runs command without silent mode
    {
      type: 'run',
      command: 'echo "Hello World!"',
      silent: false,
    },
    // Runs multiple commands
    {
      type: 'run',
      command: ['npm i', 'npm run start'],
    },
    // Same as above, but using command separators
    {
      type: 'run',
      command: 'npm i && npm run start', // or 'npm i; npm run start'
    },
  ];
});
```

#### Changing directory

Each `run` action is executed at the **initial directory**, where `faberconfig` is found.

When a `cd` command is used to change the current directory, this navigation persists only within the current action, to the next commands from the same action.

When a `run` action completes, the `cd` navigation is restored to the initial directory for the next action.

See the example below:

```js
[
  // Creates a directory `foo` at ./subfolder
  {
    type: 'run',
    command: ['cd subfolder', 'mkdir foo'], // or using && intead
  },
  // Creates a directory `bar` at ./
  // ignoring navigation from previous actions
  {
    type: 'run',
    command: 'mkdir bar',
  },
];
```

#### Considerations

- Using **command separators** (`&&` or `;`) has the same behavior as using an array with multiple commands. It's just a matter of preference;
- When **changing directories** (i.e. `cd path/to/folder`), the navigation persists for other commands in the current action;
- By default, **nothing is logged** from the executed commands. To display the commands' output in the terminal, set the `silent` option as `false`;
- This action uses the [shelljs](https://www.npmjs.com/package/shelljs) library for executing the commands, using the `exec()` function for running the commands, and the `cd()` function for `cd` commands (to change directory).

## Commands (CLI)

The CLI has commands to **create** new projects, **test** boilerplates, and also **manage** available repository aliases on your local machine.

In a nutshell, you will use:

- `faber create` – To create new projects from a pre-configured boilerplate. This command **clones the repo** and then executes the `faber execute` command inside of it.
- `faber execute` – To execute the configured actions on the current folder. When preparing a boilerplate, you can use this command to test the actions you are writing.
- `faber ls|add|rm` – To manage aliases to your boilerplates for ease of usage when using the `faber create` command.

### `faber create`

Creates a new project using a pre-configured boilerplate.

#### Usage example

```shell
$ faber create my-project
```

Including URL to clone repository and other flags:

```shell
$ faber create my-project https://github.com/path/example.git --branch main --use-existing
```

#### Arguments

`faber create <name> [clone_url]`

- `<name>` – Name of the project's root folder.
- `[clone_url]` – The URL for cloning the repository (can be SSL or HTTPS, depending on your permissions and authentication).

#### Flags (optional)

- `--use-existing` (bool) – If the folder already exists, skip the prompt and continue with the existing folder, without cloning any repository.
- `--override-existing` (bool) – If the folder already exists, skip the prompt and delete the existing folder before cloning the repository.
- `--branch` (string) – Name of the git branch to retrieve from the repository. If not defined, the default branch is used.
- `--keep-git` (bool) – Prevent deleting the existing Git history from the new cloned folder, removed by default.

Also includes all flags available to the `faber execute` command:

- `--data` (string) – JSON data (preferrably encoded) to be passed to the actions.
- `--no-preview` (bool) – Does not show the JSON data preview.
- `--deep-preview` (bool) – Shows the JSON data preview with all the properties and array items expanded.
- `--no-results` (bool) – Does not show the actions results.

#### What does it do?

1. Clones the boilerplate repository in the current directory into a new folder with the provided name.
2. Run the steps from the `faber execute` command.
3. Deletes the `.git` folder from the repository (when not using the `--keep-git` flag);

> **Notice**: You need to have permission to read from the boilerplate repository. When using private repositories, you need to authenticate via SSH or HTTPS as you normally would when cloning.

### `faber execute`

Executes the configured actions on the current directory. Useful for configuring and testing actions.

> A [faberconfig](#configuring-faberconfig) file should be present on the directory.

#### Usage examples

```shell
$ faber execute
```

Including JSON data and other flags:

```shell
$ faber execute --data "{title:\"Example\"}" --no-preview
```

#### Flags (optional)

- `--data` (string) – JSON data (preferrably encoded) to be passed to the actions.
- `--no-preview` (bool) – Does not show the JSON data preview.
- `--deep-preview` (bool) – Shows the JSON data preview with all the properties and array items expanded.
- `--no-results` (bool) – Does not show the actions results.

#### What does it do?

1. Read the `faberconfig` file from the directory;
2. Ask for the **JSON data** to pass to the actions (when not provided with the `--data` flag);
3. Display a **preview of the data** (when not using the `--no-preview` flag);
4. Execute the **actions** from `faberconfig` (when not using the `--dry` flag);

### `faber ls`

List your registered repository aliases.

#### Usage example

```shell
$ faber ls
```

### `faber add`

Adds a repository alias to your list of available boilerplates.

#### Usage example

```shell
$ faber add my-boilerplate https://github.com/path/example.git 'My Boilerplate'
```

#### Arguments

`faber add <alias> <repository> [name]`

- `<alias>` (_mandatory_) – Used to reference this boilerplate on other commands. It should consist only of letters, numbers, dashes and underscores.
- `<repository>` (_mandatory_) – URL to **clone** the repository. It usually ends with `.git`.
- `[name]` (_optional_) – A name for this boilerplate to display when using the `faber create` command.

### `faber rm`

Removes a repository alias from your list of available boilerplates.

#### Usage example

```shell
$ faber rm my-boilerplate
```

#### Arguments

`faber rm <alias>`

- `<alias>` (_mandatory_) – The reference to the boilerplate to remove from your list.

## Mentions

This documentation was inspired by the [Plop](https://plopjs.com/) documentation.

_Plop_ is an amazing micro-framework with a similar goal as _Faber_, however, while _Plop_ is great for generating code inside your project using [Handlebars](https://handlebarsjs.com/) as template engine, _Faber_ is fully focused on starting new projects, with no defined template engine, so that you can run the boilerplate project on its own, for testing or development, while still making it a living boilerplate to clone with Faber.

_P.S. You can use both together in your projects to make your life easier._ 😉
