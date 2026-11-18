import { Logger } from "@nestjs/common";
import { createRequire } from "node:module";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { AppException } from "./app-exception.js";
import { ExceptionLocalizer } from "./exception-localizer.js";
import { GenericExceptionFilter } from "./generic-exception-filter.js";
import { MultiAppException } from "./multi-app-exception.js";

import type { HttpAwareException } from "./app-exception.js";
import type { LocalizableError } from "./exception-localizer.js";
import type { ArgumentsHost } from "@nestjs/common";
import type { GraphQLError } from "graphql";

class TestException
	extends AppException<{ name: string }>
	implements HttpAwareException
{
	public readonly code = "TEST__ERROR";
	public readonly httpStatus = 400;

	public constructor(name: string) {
		super(`Test error for '${name}'`, { meta: { name } });
	}
}

class NoMetaException extends AppException {
	public readonly code = "TEST__NO_META";

	public constructor() {
		super("No meta");
	}
}

class GermanLocalizer extends ExceptionLocalizer {
	public localize(error: LocalizableError): string | undefined {
		if (error.code === "DEFAULT__MULTIPLE_ERRORS") {
			return "Mehrere Fehler";
		}

		return `Fehler ${error.code}`;
	}
}

class UndefinedLocalizer extends ExceptionLocalizer {
	public localize(): string | undefined {
		return undefined;
	}
}

class ThrowingLocalizer extends ExceptionLocalizer {
	public localize(): string | undefined {
		throw new Error("boom");
	}
}

function createHttpHost() {
	const result: { status?: number; body?: unknown } = {};
	const response = {
		setHeader: () => undefined,
		status: (code: number) => {
			result.status = code;

			return response;
		},
		json: (body: unknown) => {
			result.body = body;

			return response;
		},
	};
	const host = {
		getType: () => "http",
		switchToHttp: () => ({ getResponse: () => response }),
	} as unknown as ArgumentsHost;

	return { host, result };
}

const graphqlHost = { getType: () => "graphql" } as unknown as ArgumentsHost;

function catchGraphQLError(
	filter: GenericExceptionFilter,
	exception: unknown,
): GraphQLError {
	try {
		filter.catch(exception, graphqlHost);
	} catch (error) {
		if (error instanceof Error && error.name === "GraphQLError") {
			return error as GraphQLError;
		}
	}

	throw new Error("Expected a GraphQLError");
}

describe("generic-exception-filter.ts", () => {
	beforeAll(() => {
		Logger.overrideLogger(false);
		// The filter loads graphql via require, which ESM test modules lack.
		vi.stubGlobal("require", createRequire(import.meta.url));
	});

	describe("http", () => {
		it("uses details without a localizer", () => {
			const { host, result } = createHttpHost();

			new GenericExceptionFilter().catch(new TestException("a"), host);

			expect(result.status).toBe(400);
			expect(result.body).toEqual({
				errors: [
					{
						code: "TEST__ERROR",
						detail: "Test error for 'a'",
						status: "400",
						source: undefined,
						meta: { name: "a" },
					},
				],
			});
		});

		it("omits empty meta", () => {
			const { host, result } = createHttpHost();

			new GenericExceptionFilter().catch(new NoMetaException(), host);

			expect(result.body).toEqual({
				errors: [{ code: "TEST__NO_META", detail: "No meta" }],
			});
			expect(JSON.stringify(result.body)).not.toContain(`"meta"`);
		});

		it("uses the localized detail", () => {
			const { host, result } = createHttpHost();

			new GenericExceptionFilter(new GermanLocalizer()).catch(
				new TestException("a"),
				host,
			);

			expect(result.body).toMatchObject({
				errors: [{ code: "TEST__ERROR", detail: "Fehler TEST__ERROR" }],
			});
		});

		it("falls back to details when the localizer returns undefined", () => {
			const { host, result } = createHttpHost();

			new GenericExceptionFilter(new UndefinedLocalizer()).catch(
				new TestException("a"),
				host,
			);

			expect(result.body).toMatchObject({
				errors: [{ detail: "Test error for 'a'" }],
			});
		});

		it("falls back to details when the localizer throws", () => {
			const { host, result } = createHttpHost();

			new GenericExceptionFilter(new ThrowingLocalizer()).catch(
				new TestException("a"),
				host,
			);

			expect(result.body).toMatchObject({
				errors: [{ detail: "Test error for 'a'" }],
			});
		});

		it("localizes each error of a MultiAppException", () => {
			const { host, result } = createHttpHost();

			new GenericExceptionFilter(new GermanLocalizer()).catch(
				new MultiAppException([new TestException("a"), new TestException("b")]),
				host,
			);

			expect(result.body).toMatchObject({
				errors: [
					{ detail: "Fehler TEST__ERROR", meta: { name: "a" } },
					{ detail: "Fehler TEST__ERROR", meta: { name: "b" } },
				],
			});
		});
	});

	describe("graphql", () => {
		it("uses details without a localizer", () => {
			const error = catchGraphQLError(
				new GenericExceptionFilter(),
				new TestException("a"),
			);

			expect(error.message).toBe("Test error for 'a'");
			expect(error.extensions["app_exception"]).toEqual({
				code: "TEST__ERROR",
				meta: { name: "a" },
			});
		});

		it("uses the localized message", () => {
			const error = catchGraphQLError(
				new GenericExceptionFilter(new GermanLocalizer()),
				new TestException("a"),
			);

			expect(error.message).toBe("Fehler TEST__ERROR");
		});

		it("falls back to details when the localizer throws", () => {
			const error = catchGraphQLError(
				new GenericExceptionFilter(new ThrowingLocalizer()),
				new TestException("a"),
			);

			expect(error.message).toBe("Test error for 'a'");
		});

		it("uses the default multi-error message without a localizer", () => {
			const error = catchGraphQLError(
				new GenericExceptionFilter(),
				new MultiAppException([new TestException("a"), new TestException("b")]),
			);

			expect(error.message).toBe("Multiple errors occurred");
		});

		it("localizes the multi-error message and each entry", () => {
			const error = catchGraphQLError(
				new GenericExceptionFilter(new GermanLocalizer()),
				new MultiAppException([new TestException("a"), new TestException("b")]),
			);

			expect(error.message).toBe("Mehrere Fehler");
			expect(error.extensions["app_exception"]).toMatchObject({
				multiple_errors: [
					{ detail: "Fehler TEST__ERROR" },
					{ detail: "Fehler TEST__ERROR" },
				],
			});
		});
	});
});
