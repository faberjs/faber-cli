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
