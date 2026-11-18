import {
	AppException,
	ExceptionLocalizer,
	GenericExceptionFilter,
} from "@abinnovision/nestjs-exceptions";
import { EntityNotFoundException } from "@abinnovision/nestjs-exceptions/entity";
import { Logger } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { I18nExceptionLocalizer } from "./i18n-exception-localizer.js";
import { de, en } from "../__fixtures__/catalogs.js";
import { EmailTakenException } from "../__fixtures__/exceptions.js";
import { I18nModule } from "../i18n.module.js";
import { I18nService } from "../i18n.service.js";

import type { ArgumentsHost } from "@nestjs/common";

class UnknownCodeException extends AppException {
	public readonly code = "TEST__UNKNOWN";

	public constructor() {
		super("Unknown");
	}
}

function httpHost(headers: Record<string, string>) {
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
		switchToHttp: () => ({
			getRequest: () => ({ headers }),
			getResponse: () => response,
		}),
	} as unknown as ArgumentsHost;

	return { host, result };
}

function graphqlHost(key: "req" | "request", headers: Record<string, string>) {
	return {
		getType: () => "graphql",
		getArgByIndex: (index: number) =>
			index === 2 ? { [key]: { headers } } : undefined,
	} as unknown as ArgumentsHost;
}

const rpcHost = { getType: () => "rpc" } as unknown as ArgumentsHost;

function errorOf(exception: AppException<object>) {
	return {
		code: exception.code,
		detail: exception.details,
		meta: exception.meta,
		exception,
	};
}

let localizer: ExceptionLocalizer;
let i18n: I18nService;

beforeEach(async () => {
	const moduleRef = await Test.createTestingModule({
		imports: [
			I18nModule.forRoot({ defaultLocale: "en", catalogs: { en, de } }),
		],
		providers: [
			{ provide: ExceptionLocalizer, useClass: I18nExceptionLocalizer },
		],
	}).compile();

	localizer = moduleRef.get(ExceptionLocalizer);
	i18n = moduleRef.get(I18nService);
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe("i18nExceptionLocalizer", () => {
	it("uses the locale of the HTTP request", () => {
		const { host } = httpHost({ "accept-language": "de" });

		expect(
			localizer.localize(errorOf(new EmailTakenException("a@b.c")), host),
		).toBe("E-Mail 'a@b.c' ist bereits vergeben");
	});

	it("uses the request of the GraphQL context", () => {
		const error = errorOf(new EmailTakenException("a@b.c"));

		expect(
			localizer.localize(
				error,
				graphqlHost("req", { "accept-language": "de" }),
			),
		).toBe("E-Mail 'a@b.c' ist bereits vergeben");
		expect(
			localizer.localize(
				error,
				graphqlHost("request", { "accept-language": "de" }),
			),
		).toBe("E-Mail 'a@b.c' ist bereits vergeben");
	});

	it("falls back to the context locale without a request", () => {
		const error = errorOf(new EmailTakenException("a@b.c"));

		expect(localizer.localize(error, rpcHost)).toBe(
			"Email 'a@b.c' is already taken",
		);
		expect(i18n.run("de", () => localizer.localize(error, rpcHost))).toBe(
			"E-Mail 'a@b.c' ist bereits vergeben",
		);
	});

	it("translates the entity name or uses the raw name", () => {
		const { host } = httpHost({ "accept-language": "de" });

		expect(
			localizer.localize(
				errorOf(new EntityNotFoundException({ entity: "user", entityId: "1" })),
				host,
			),
		).toBe("Benutzer mit ID '1' wurde nicht gefunden");
		expect(
			localizer.localize(
				errorOf(
					new EntityNotFoundException({ entity: "order", entityId: "2" }),
				),
				host,
			),
		).toBe("order mit ID '2' wurde nicht gefunden");
	});

	it("returns undefined for a missing message", () => {
		const debug = vi
			.spyOn(Logger.prototype, "debug")
			.mockImplementation(() => {});

		expect(
			localizer.localize(errorOf(new UnknownCodeException()), rpcHost),
		).toBeUndefined();
		expect(debug).toHaveBeenCalledOnce();
	});

	it("returns undefined and warns when a parameter is missing", () => {
		const warn = vi
			.spyOn(Logger.prototype, "warn")
			.mockImplementation(() => {});
		const error = { ...errorOf(new EmailTakenException("a@b.c")), meta: {} };

		expect(() => localizer.localize(error, rpcHost)).not.toThrow();
		expect(localizer.localize(error, rpcHost)).toBeUndefined();
		expect(warn).toHaveBeenCalled();
	});

	it("localizes the response of the GenericExceptionFilter", () => {
		vi.spyOn(Logger.prototype, "warn").mockImplementation(() => {});
		const filter = new GenericExceptionFilter(localizer);
		const { host, result } = httpHost({ "accept-language": "de" });

		filter.catch(
			new EntityNotFoundException({ entity: "user", entityId: "1" }),
			host,
		);

		expect(result).toEqual({
			status: 404,
			body: {
				errors: [
					{
						code: "COMMON__NOT_FOUND",
						detail: "Benutzer mit ID '1' wurde nicht gefunden",
						status: "404",
						source: undefined,
						meta: { entityName: "user", entityId: "1" },
					},
				],
			},
		});
	});
});
