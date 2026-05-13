/**
 * Additional (optional) options for the {@link AppException}.
 */
export interface AppExceptionOpts<M = unknown> {
	/**
	 * A JSON Pointer (RFC 6901) to the source of the error.
	 */
	sourcePointer?: string;

	/**
	 * Additional meta-information about the exception.
	 */
	meta?: M;

	/**
	 * The underlying cause of the exception.
	 */
	cause?: Error;
}

/**
 * A version of {@link AppExceptionOpts} without the `meta` property.
 */
export type AppExceptionOptsWithoutMeta = Omit<AppExceptionOpts, "meta">;

/**
 * The base exception class for standardized error handling.
 *
 * Extend this class to create domain-specific exceptions with consistent
 * error codes and typed metadata. This class is transport-agnostic — it
 * does not assume HTTP or any other protocol.
 *
 * For HTTP-aware exceptions, implement the {@link HttpAwareException}
 * interface on your subclass.
 *
 * @example
 * ```typescript
 * interface ValidationMeta {
 *   field: string;
 *   constraint: string;
 * }
 *
 * export class ValidationException extends AppException<ValidationMeta> {
 *   public override code = 'VALIDATION__FAILED';
 *
 *   constructor(field: string, constraint: string) {
 *     super(`Validation failed for field '${field}': ${constraint}`, {
 *       meta: { field, constraint },
 *     });
 *   }
 * }
 * ```
 *
 * @see MultiAppException for handling multiple exceptions at once.
 * @see HttpAwareException for HTTP-specific properties.
 */
export abstract class AppException<M = unknown> extends Error {
	/**
	 * The error code identifying this exception type.
	 * Should follow the pattern: `NAMESPACE__ERROR_NAME`
	 *
	 * @example "COMMON__NOT_FOUND", "AUTH__UNAUTHORIZED"
	 */
	public abstract code: string;

	/**
	 * The human-readable error message.
	 */
	public readonly details: string;

	/**
	 * The underlying cause of the exception.
	 */
	public override readonly cause?: Error;

	/**
	 * A JSON Pointer (RFC 6901) to the source of the error.
	 */
	public readonly sourcePointer?: string;

	/**
	 * Additional typed meta-information about the exception.
	 */
	public readonly meta?: M;

	/**
	 * Creates a new {@link AppException} instance.
	 *
	 * @param details - Human-readable error message
	 * @param opts - Additional options including cause, sourcePointer, and meta
	 */
	public constructor(details: string, opts?: AppExceptionOpts<M>) {
		super(details);

		this.details = details;

		if (opts?.cause !== undefined) {
			this.cause = opts.cause;
		}

		if (opts?.sourcePointer !== undefined) {
			this.sourcePointer = opts.sourcePointer;
		}

		if (opts?.meta !== undefined) {
			this.meta = opts.meta;
		}
	}
}

/**
 * Interface for exceptions that carry HTTP-specific information.
 *
 * Implement this on {@link AppException} subclasses that should influence
 * HTTP response status codes and headers.
 *
 * @example
 * ```typescript
 * export class UnauthorizedException
 *   extends AppException
 *   implements HttpAwareException {
 *
 *   public override code = 'AUTH__UNAUTHORIZED';
 *   public readonly httpStatus = 401;
 *   public readonly headers = { 'WWW-Authenticate': 'Bearer' };
 *
 *   constructor() {
 *     super('Authentication required');
 *   }
 * }
 * ```
 */
export interface HttpAwareException {
	/**
	 * The HTTP status code for this exception.
	 */
	readonly httpStatus: number;

	/**
	 * Optional HTTP headers to include in the response.
	 */
	readonly headers?: Record<string, string>;
}

/**
 * Type guard to check if an exception implements {@link HttpAwareException}.
 */
export function isHttpAwareException(
	exception: unknown,
): exception is HttpAwareException {
	return (
		typeof exception === "object" &&
		exception !== null &&
		"httpStatus" in exception &&
		typeof (exception as HttpAwareException).httpStatus === "number"
	);
}
