import type { InputType } from "@hatchet-dev/typescript-sdk";
import type { StandardSchemaV1 } from "@standard-schema/spec";

/**
 * Interface for classes that provide a schema for their input.
 */
export interface InputSchemaProvider<T> {
	/**
	 * Returns the schema for the input of the host.
	 * If undefined, the input is not validated.
	 */
	inputSchema: () => StandardSchemaV1<InputType, T> | undefined;
}

/**
 * Marker class for Hatchet workflow host classes.
 */
export abstract class WorkflowHost<I> implements InputSchemaProvider<I> {
	// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
	public readonly __workflow_host_brand!: void;
	public readonly __workflow_host_input!: I;

	/**
	 * Constructor for the WorkflowHost class.
	 *
	 * @param inputSchema
	 * @protected
	 */
	protected constructor(
		public readonly inputSchema: InputSchemaProvider<I>["inputSchema"],
	) {}
}

/**
 * Marker class for Hatchet task host classes.
 */
export abstract class TaskHost<I> implements InputSchemaProvider<I> {
	// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
	public readonly __task_host_brand!: void;
	public readonly __task_host_input!: I;

	/**
	 * Constructor for the TaskHost class.
	 *
	 * @param inputSchema
	 * @protected
	 */
	protected constructor(
		public readonly inputSchema: InputSchemaProvider<I>["inputSchema"],
	) {}
}

/**
 * Creates a new WorkflowHost class with the provided input schema.
 *
 * @param input The input schema.
 */
export function workflowHost<I>(
	input:
		| ReturnType<InputSchemaProvider<I>["inputSchema"]>
		| undefined = undefined,
) {
	class WorkflowHostIntermediate extends WorkflowHost<I> {
		public constructor() {
			super(() => input);
		}
	}

	return WorkflowHostIntermediate;
}

/**
 * Creates a new TaskHost class with the provided input schema.
 *
 * @param input The input schema.
 */
export function taskHost<I>(
	input:
		| ReturnType<InputSchemaProvider<I>["inputSchema"]>
		| undefined = undefined,
) {
	class TaskHostIntermediate extends TaskHost<I> {
		public constructor() {
			super(() => input);
		}
	}

	return TaskHostIntermediate;
}
