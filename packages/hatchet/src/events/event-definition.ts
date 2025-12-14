import type { StandardSchemaV1 } from "@standard-schema/spec";

/**
 * Marker embedded in event payload to identify an event type.
 * Used by isCtx() type guard to determine which event triggered the workflow.
 */
export const EVENT_MARKER = "__event_name";

/**
 * Type-safe event definition.
 * Use with Client.emit() to publish events.
 *
 * @template TName The literal string type of the event name.
 * @template TSchema The StandardSchema type for input validation.
 */
export class EventDefinition<
	TName extends string,
	TSchema extends StandardSchemaV1,
> {
	public readonly name: TName;
	public readonly schema: TSchema;

	/**
	 * Phantom types for input/output inference.
	 * Do not access at runtime - will throw.
	 */
	public readonly __types!: {
		input: StandardSchemaV1.InferInput<TSchema>;
		output: StandardSchemaV1.InferOutput<TSchema>;
	};

	public constructor(name: TName, schema: TSchema) {
		this.name = name;
		this.schema = schema;

		// Make __types throw at runtime (phantom type pattern)
		Object.defineProperty(this, "__types", {
			get() {
				throw new Error(
					"__types is a phantom property for type inference only",
				);
			},
		});
	}

	/**
	 * Type guard: checks if the context was triggered by this event.
	 * Validates the input against the event schema and throws if malformed.
	 *
	 * @param ctx The context to check (TaskCtx, WorkflowCtx, HelperCtx, or SDK Context).
	 * @returns True if the context input contains the event marker matching this event.
	 * @throws Error if the event marker matches but the payload fails schema validation.
	 */
	public isCtx<C extends { input: unknown }>(
		ctx: C,
	): ctx is C & {
		input: StandardSchemaV1.InferOutput<TSchema> & { [EVENT_MARKER]: TName };
	} {
		// Check if the event marker matches
		if (
			typeof ctx.input !== "object" ||
			ctx.input === null ||
			!(EVENT_MARKER in ctx.input) ||
			(ctx.input as Record<string, unknown>)[EVENT_MARKER] !== this.name
		) {
			return false;
		}

		// Validate the input against the schema
		const result = this.schema["~standard"].validate(ctx.input);

		// Handle async validation - not supported
		if (result instanceof Promise) {
			throw new Error(
				`Event '${this.name}' schema validation must be synchronous. Use a sync schema.`,
			);
		}

		// Check for validation errors
		if ("issues" in result && result.issues) {
			throw new Error(
				`Event '${this.name}' payload is malformed: ${JSON.stringify(result.issues)}`,
			);
		}

		return true;
	}
}

/**
 * Any event definition, used for generic constraints.
 */
export type AnyEventDefinition = EventDefinition<string, StandardSchemaV1>;

/**
 * Extracts the input type from an event definition.
 */
export type EventInput<E extends AnyEventDefinition> = E["__types"]["input"];

/**
 * Extracts the output type from an event definition.
 */
export type EventOutput<E extends AnyEventDefinition> = E["__types"]["output"];

/**
 * Factory function to create a type-safe event definition.
 *
 * @param name The event name (e.g., "user:created").
 * @param schema A StandardSchema-compatible schema (e.g., Zod schema).
 * @returns A new EventDefinition instance.
 *
 * @example
 * ```typescript
 * import { z } from "zod";
 *
 * const UserCreatedEvent = defineEvent("user:created", z.object({
 *   userId: z.string(),
 *   email: z.string().email(),
 * }));
 * ```
 */
export const defineEvent = <
	TName extends string,
	TSchema extends StandardSchemaV1,
>(
	name: TName,
	schema: TSchema,
): EventDefinition<TName, TSchema> => new EventDefinition(name, schema);
