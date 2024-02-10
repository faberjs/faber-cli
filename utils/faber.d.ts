declare module 'faber' {
	export function setToken(token: { in: string; out: string });
	/**
	 * Set the actions to be executed when the `faber execute` or `faber create` commands are run.
	 * @returns void
	 */
	export function setActions(actions: FaberActionConfig[]): void;

	export type FaberActionConfig =
		| ReplaceActionConfig
		| ConditionalActionConfig
		| DeleteActionConfig
		| MoveActionConfig
		| RunActionConfig;

	export interface ReplaceActionConfig {
		/**
		 * Type of action to execute. Available options are `replace`, `conditional`, `delete`, `move` and `run`.
		 */
		type: 'replace';
		/**
		 * Files(s) to be modified. Accepts a `string` or an array of `string`.
		 */
		files: string | string[];
		/**
		 * Optionally define file(s) to be ignored. Accepts a `string` or an array of `string`.
		 */
		ignore?: string | string[];
		/**
		 * `string`(s) or regular expression(s) to be replaced.
		 */
		from: string | RegExp | (string | RegExp)[];
		/**
		 * `string`(s) to replace the `from` value(s), respectively. Accepts a `string` or an array of `string`.
		 */
		to: string | string[];
	}

	export interface ConditionalActionConfig {
		/**
		 * Type of action to execute. Available options are `replace`, `conditional`, `delete`, `move` and `run`.
		 */
		type: 'conditional';
		/**
		 * Files(s) to be modified. Accepts a `string` or an array of `string`.
		 */
		files: string | string[];
		/**
		 * Optionally define file(s) to be ignored. Accepts a `string` or an array of `string`.
		 */
		ignore?: string | string[];
		/**
		 * Conditional comment block identifier to evaluate.
		 */
		identifier: string;
		/**
		 * Condition to be evaluated. If `true`, the content inside the conditional block is kept, otherwise, it's removed.
		 */
		condition: boolean;
	}

	export interface DeleteActionConfig {
		/**
		 * Type of action to execute. Available options are `replace`, `conditional`, `delete`, `move` and `run`.
		 */
		type: 'delete';
		/**
		 * File(s) to be deleted. Accepts a `string` or an array of `string`.
		 */
		paths: string | string[];
	}

	export interface MoveActionConfig {
		/**
		 * Type of action to execute. Available options are `replace`, `conditional`, `delete`, `move` and `run`.
		 */
		type: 'move';
		/**
		 * File(s) to be moved or renamed. Accepts a `string` or an array of `string`.
		 */
		from: string | string[];
		/**
		 * New file path(s) or name(s), respectively to the `from` property value. Accepts a `string` or an array of `string`.
		 */
		to: string | string[];
	}

	export interface RunActionConfig {
		/**
		 * Type of action to execute. Available options are `replace`, `conditional`, `delete`, `move` and `run`.
		 */
		type: 'run';
		/**
		 * Shell command(s) to be executed. Accepts a `string` or an array of `string`.
		 */
		command: string | string[];
		/**
		 * Optionally define if should print the command(s) output on the console. Default is `true` (omits the outputs).
		 */
		silent?: boolean;
	}
}
/*

 */
