import type { HatchetInputType } from "../types";
import type { StandardSchemaV1 } from "@standard-schema/spec";

/**
 * Interface for classes that provide a schema for their input.
 */
export interface InputSchemaProvider<T extends HatchetInputType> {
	/**
	 * Returns the schema for the input of the host.
	 * If undefined, the input is not validated.
	 */
	inputSchema: () => StandardSchemaV1<any, T> | undefined;
}

/**
 * Marker class for Hatchet workflow host classes.
 */
export abstract class WorkflowHost<I extends HatchetInputType>
	implements InputSchemaProvider<I>
{
	// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
	public readonly __workflow_host_brand!: void;
	public readonly __workflow_host_input!: I;

	public inputSchema(): StandardSchemaV1<any, I> | undefined {
		// By default, the input is not validated. It's also not enforced.
		return undefined;
	}
}

/**
 * Marker class for Hatchet task host classes.
 */
export abstract class TaskHost<I extends HatchetInputType>
	implements InputSchemaProvider<I>
{
	// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
	public readonly __task_host_brand!: void;
	public readonly __task_host_input!: I;

	public inputSchema(): StandardSchemaV1<any, I> | undefined {
		// By default, the input is not validated. It's also not enforced.
		return undefined;
	}
}
