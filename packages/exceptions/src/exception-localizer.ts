import type { ArgumentsHost } from "@nestjs/common";

/**
 * An error as seen by an {@link ExceptionLocalizer}.
 */
export interface LocalizableError {
	/**
	 * The error code, e.g. `COMMON__NOT_FOUND`.
	 */
	readonly code: string;

	/**
	 * The fallback message (English details or the HttpException message).
	 */
	readonly detail: string;

	/**
	 * The public meta-information of the error.
	 */
	readonly meta?: unknown;

	/**
	 * The original exception.
	 */
	readonly exception: unknown;
}

/**
 * DI token for localizing error messages in the `GenericExceptionFilter`.
 *
 * When no provider is registered, the filter uses `detail` as is.
 * Implementations must be synchronous and should not throw. Return
 * `undefined` to keep `detail`.
 *
 * @example
 * ```typescript
 * @Module({
 *   providers: [
 *     { provide: ExceptionLocalizer, useClass: MyExceptionLocalizer },
 *     { provide: APP_FILTER, useClass: GenericExceptionFilter },
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
export abstract class ExceptionLocalizer {
	public abstract localize(
		error: LocalizableError,
		host: ArgumentsHost,
	): string | undefined;
}
