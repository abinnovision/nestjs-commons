import type { AppException } from "./app-exception";

/**
 * An exception that wraps multiple {@link AppException} instances.
 *
 * Use this when multiple validation errors or business rule violations
 * need to be reported at once.
 *
 * @example
 * ```typescript
 * const errors: AppException[] = [];
 *
 * if (!user.email) {
 *   errors.push(new ValidationException('email', 'required'));
 * }
 *
 * if (!user.name) {
 *   errors.push(new ValidationException('name', 'required'));
 * }
 *
 * if (errors.length > 0) {
 *   throw new MultiAppException(errors);
 * }
 * ```
 *
 * @see AppException
 */
export class MultiAppException extends Error {
	/**
	 * The exceptions that were collected.
	 */
	public readonly exceptions: AppException[];

	/**
	 * Creates a new {@link MultiAppException} instance.
	 *
	 * @param exceptions - The exceptions to wrap
	 */
	public constructor(exceptions: AppException[]) {
		super("Multiple exceptions occurred");

		this.exceptions = exceptions;
	}
}
