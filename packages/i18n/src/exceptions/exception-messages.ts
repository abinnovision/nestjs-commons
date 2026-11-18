import type {
	AppExceptionClass,
	ExceptionCode,
} from "@abinnovision/nestjs-exceptions";

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
