import { Catch, HttpException, Logger } from "@nestjs/common";

import { AppException, isHttpAwareException } from "./app-exception";
import { MultiAppException } from "./multi-app-exception";

import type { ArgumentsHost, ExceptionFilter } from "@nestjs/common";
import type { Response } from "express";

/**
 * Intermediate error object used for consistent error formatting.
 */
interface IntermediateErrorObject {
	code: string;
	detail: string;
	status?: string | undefined;
	source?: { pointer?: string | undefined } | undefined;
	meta?: unknown;
	headers?: Record<string, string> | undefined;
}

const INTERNAL_SERVER_ERROR: IntermediateErrorObject = {
	code: "DEFAULT__INTERNAL_SERVER_ERROR",
	detail: "An internal server error occurred",
	status: "500",
};

/**
 * Checks if GraphQL context type is available.
 */
function isGraphQLContext(host: ArgumentsHost): boolean {
	try {
		const contextType = host.getType<string>();

		return contextType === "graphql";
	} catch {
		return false;
	}
}

/**
 * Cached reference to the GraphQLError constructor.
 */
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
type GraphQLErrorConstructor = typeof import("graphql").GraphQLError;
let cachedGraphQLError: GraphQLErrorConstructor | null = null;
let graphqlResolved = false;

/**
 * Try to resolve the GraphQLError constructor from the graphql package.
 */
function resolveGraphQLError(): GraphQLErrorConstructor | undefined {
	if (graphqlResolved) {
		return cachedGraphQLError ?? undefined;
	}

	graphqlResolved = true;

	try {
		// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/consistent-type-imports
		const { GraphQLError } = require("graphql") as typeof import("graphql");
		cachedGraphQLError = GraphQLError;

		return GraphQLError;
	} catch {
		return undefined;
	}
}

/**
 * A generic exception filter that handles both HTTP and GraphQL contexts.
 *
 * Converts {@link AppException}, {@link MultiAppException}, and standard
 * {@link HttpException} instances to consistent error responses.
 *
 * For HTTP responses, the filter uses the {@link HttpAwareException}
 * interface to determine status codes and headers.
 *
 * @example Register globally
 * ```typescript
 * // main.ts
 * app.useGlobalFilters(new GenericExceptionFilter());
 * ```
 *
 * @example Register via module
 * ```typescript
 * // app.module.ts
 * @Module({
 *   providers: [
 *     { provide: APP_FILTER, useClass: GenericExceptionFilter },
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Catch()
export class GenericExceptionFilter implements ExceptionFilter {
	private readonly logger = new Logger(GenericExceptionFilter.name);

	/**
	 * Handles an exception and converts it to an appropriate response.
	 *
	 * @param exception - The exception that was thrown
	 * @param host - The arguments host providing access to the request context
	 */
	public catch(exception: unknown, host: ArgumentsHost): void {
		const errors: IntermediateErrorObject[] = [];

		if (exception instanceof AppException) {
			errors.push(this.convertAppException(exception));
		} else if (exception instanceof MultiAppException) {
			errors.push(...this.convertMultiAppException(exception));
		} else if (exception instanceof HttpException) {
			errors.push(this.convertHttpException(exception));
		} else {
			errors.push(INTERNAL_SERVER_ERROR);
		}

		this.logError(exception);

		if (isGraphQLContext(host)) {
			const graphqlError = this.createGraphQLError(errors);

			if (graphqlError) {
				throw graphqlError;
			}

			throw new Error(errors[0]?.detail ?? INTERNAL_SERVER_ERROR.detail);
		}

		// HTTP context
		const response = host.switchToHttp().getResponse<Response>();
		const statusCode = parseInt(this.resolveStatusCodeForHttp(errors), 10);
		const aggregatedHeaders = this.aggregateHeaders(errors);

		for (const [key, value] of Object.entries(aggregatedHeaders)) {
			response.setHeader(key, value);
		}

		response.status(statusCode).json({
			errors: errors.map(({ headers: _headers, ...rest }) => rest),
		});
	}

	/**
	 * Converts an AppException to an intermediate error object.
	 */
	private convertAppException(input: AppException): IntermediateErrorObject {
		const httpAware = isHttpAwareException(input);

		return {
			code: input.code,
			detail: input.details,
			status: httpAware ? input.httpStatus.toString(10) : undefined,
			source: input.sourcePointer
				? { pointer: input.sourcePointer }
				: undefined,
			meta: input.meta,
			headers: httpAware ? input.headers : undefined,
		};
	}

	/**
	 * Converts a MultiAppException to intermediate error objects.
	 */
	private convertMultiAppException(
		input: MultiAppException,
	): IntermediateErrorObject[] {
		return input.exceptions.map((err) => this.convertAppException(err));
	}

	/**
	 * Converts an HttpException to an intermediate error object.
	 */
	private convertHttpException(input: HttpException): IntermediateErrorObject {
		return {
			code: `HTTP_EXCEPTION__${input.name.toUpperCase().replace(/\s+/g, "_")}`,
			detail: input.message,
			status: input.getStatus().toString(10),
		};
	}

	/**
	 * Creates a GraphQL error from the intermediate error objects.
	 * Returns undefined if the graphql package is not available.
	 */
	private createGraphQLError(
		intermediates: IntermediateErrorObject[],
	): Error | undefined {
		const GraphQLError = resolveGraphQLError();

		if (!GraphQLError) {
			return undefined;
		}

		const primary = intermediates[0] ?? INTERNAL_SERVER_ERROR;

		if (intermediates.length > 1) {
			return new GraphQLError("Multiple errors occurred", {
				extensions: {
					app_exception: {
						code: primary.code,
						meta: primary.meta,
						multiple_errors: intermediates.map((it) => ({
							code: it.code,
							detail: it.detail,
							status: it.status,
							source: it.source,
							meta: it.meta,
						})),
					},
				},
			});
		}

		return new GraphQLError(primary.detail, {
			extensions: {
				app_exception: { code: primary.code, meta: primary.meta },
			},
		});
	}

	/**
	 * Resolves the HTTP status code for the response.
	 *
	 * If there is only one error, its status code is returned.
	 * If there are multiple errors with different codes, returns 400 if
	 * most are 4xx errors, otherwise 500.
	 */
	private resolveStatusCodeForHttp(errors: IntermediateErrorObject[]): string {
		if (errors.length === 1) {
			return errors[0]?.status ?? "500";
		}

		const allCodes = errors.map((it) => it.status);
		const fiveErrors = allCodes.filter((code) => code?.startsWith("5"));
		const fourErrors = allCodes.filter((code) => code?.startsWith("4"));

		if (fourErrors.length > fiveErrors.length) {
			return "400";
		}

		return "500";
	}

	/**
	 * Aggregates headers from all errors into a single record.
	 * Later errors take precedence for duplicate header keys.
	 */
	private aggregateHeaders(
		errors: IntermediateErrorObject[],
	): Record<string, string> {
		const aggregated: Record<string, string> = {};

		for (const error of errors) {
			if (error.headers) {
				Object.assign(aggregated, error.headers);
			}
		}

		return aggregated;
	}

	/**
	 * Logs the error for debugging purposes.
	 */
	private logError(error: unknown): void {
		if (error instanceof AppException || error instanceof MultiAppException) {
			this.logger.warn(error, "Request handled with app exception");
		} else if (error instanceof HttpException) {
			this.logger.warn(error, "Request handled with HTTP exception");
		} else {
			this.logger.error(error, "Request handled with unexpected error");
		}
	}
}
