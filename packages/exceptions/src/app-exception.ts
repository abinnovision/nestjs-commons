/**
 * Meta type of exceptions without meta-information.
 */
export type EmptyMeta = Record<never, never>;

/**
 * Additional (optional) options for the {@link AppException}.
 */
export interface AppExceptionOpts<M extends object = EmptyMeta> {
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
 * error codes and typed metadata. This class is transport-agnostic and
 * does not assume HTTP or any other protocol.
 *
 * Declare `code` as `public readonly code = "NS__NAME"` to keep its literal
 * type. The subclass constructor defines which arguments are required.
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
 *   public readonly code = 'VALIDATION__FAILED';
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
export abstract class AppException<M extends object = EmptyMeta> extends Error {
	/**
	 * The error code identifying this exception type.
	 * Should follow the pattern: `NAMESPACE__ERROR_NAME`
	 *
	 * @example "COMMON__NOT_FOUND", "AUTH__UNAUTHORIZED"
	 */
	public abstract readonly code: string;

	/**
	 * The English developer message, intended for logs.
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
	 * Public, typed meta-information about the exception. It is serialized
	 * into the response and used as message parameters by localizers.
	 * Defaults to `{}`.
	 */
	public readonly meta: M;

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

		this.meta = (opts?.meta ?? {}) as M;
	}
}

/**
 * Matches any {@link AppException} class, including abstract classes and
 * classes with protected constructors.
 */
export interface AppExceptionClass {
	readonly prototype: AppException<any>;
}

/**
 * The `code` type of an {@link AppException} class.
 */
export type ExceptionCode<E extends AppExceptionClass> = E["prototype"]["code"];

/**
 * The `meta` type of an {@link AppException} class.
 */
export type ExceptionMeta<E extends AppExceptionClass> = E["prototype"]["meta"];

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
 *   public readonly code = 'AUTH__UNAUTHORIZED';
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
