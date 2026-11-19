import type {
	AppExceptionClass,
	ExceptionCode,
} from "@abinnovision/nestjs-exceptions";
import type { EntityName } from "@abinnovision/nestjs-exceptions/entity";

/**
 * Requires an `exceptions.<CODE>` message for each listed exception class.
 *
 * Apply `satisfies` to the `defineCatalog()` result, not to its argument,
 * so the messages keep their literal types. Other keys are allowed.
 *
 * @example
 * ```typescript
 * const en = defineCatalog({
 *   ...defaultExceptionMessages,
 *   "exceptions.USER__EMAIL_TAKEN": "Email ''{email}'' is already taken",
 * }) satisfies ExceptionMessages<typeof EmailTakenException>;
 * ```
 */
export type ExceptionMessages<E extends AppExceptionClass> = {
	[K in `exceptions.${ExceptionCode<E>}`]: string;
};

/**
 * The exception classes among the exports of a module type. Excludes
 * non-exception exports and classes whose `code` is not a literal.
 *
 * @example
 * ```typescript
 * import type * as userExceptions from "./user.exceptions.js";
 *
 * type Messages = ExceptionMessages<ExceptionsOf<typeof userExceptions>>;
 * ```
 */
export type ExceptionsOf<M> = {
	[K in keyof M]: M[K] extends AppExceptionClass
		? string extends ExceptionCode<M[K]>
			? never
			: M[K]
		: never;
}[keyof M];

/**
 * Requires an `entities.<name>` message per entity name. Requires nothing
 * while `EntityRegistry` is not augmented.
 */
export type EntityMessages<E extends string = EntityName> = string extends E
	? Record<never, never>
	: { [K in `entities.${E}`]: string };
