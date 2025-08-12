import type {
	InputType,
	JsonObject,
	OutputType,
} from "@hatchet-dev/typescript-sdk/v1/types";
import type { StandardSchemaV1 } from "@standard-schema/spec";

export type HatchetCompSchema = StandardSchemaV1<JsonObject, JsonObject>;

/**
 * Describes the input type for a Hatchet task.
 */
export type HatchetInputType = InputType;

/**
 * Describes the output type for a Hatchet task.
 */
export type HatchetOutputType = OutputType;

/**
 * Describes the output type for a Hatchet workflow.
 *
 * Keys are the names of the tasks, values are the output types of the tasks.
 */
export type HatchetWorkflowOutput = Record<string, HatchetOutputType>;
