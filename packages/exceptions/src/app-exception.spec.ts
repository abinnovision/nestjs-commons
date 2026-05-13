import { describe, expect, it } from "vitest";

import { AppException, isHttpAwareException } from "./app-exception";

import type { HttpAwareException } from "./app-exception";

class TestException extends AppException<{ field: string }> {
	public code = "TEST__ERROR";
}

class HttpAwareTestException
	extends AppException
	implements HttpAwareException
{
	public code = "TEST__HTTP_AWARE";
	public readonly httpStatus = 400;
	public readonly headers = { "X-Custom": "value" };
}

describe("app-exception.ts", () => {
	describe("appException", () => {
		it("sets details from constructor", () => {
			const error = new TestException("Something went wrong");

			expect(error.details).toBe("Something went wrong");
		});

		it("sets message from details", () => {
			const error = new TestException("Something went wrong");

			expect(error.message).toBe("Something went wrong");
		});

		it("sets meta from options", () => {
			const error = new TestException("Error", { meta: { field: "name" } });

			expect(error.meta).toEqual({ field: "name" });
		});

		it("sets cause from options", () => {
			const cause = new Error("Original error");
			const error = new TestException("Error", { cause });

			expect(error.cause).toBe(cause);
		});

		it("sets sourcePointer from options", () => {
			const error = new TestException("Error", {
				sourcePointer: "/data/name",
			});

			expect(error.sourcePointer).toBe("/data/name");
		});

		it("extends Error", () => {
			const error = new TestException("Error");

			expect(error).toBeInstanceOf(Error);
		});

		it("has abstract code property", () => {
			const error = new TestException("Error");

			expect(error.code).toBe("TEST__ERROR");
		});

		it("does not have httpStatus by default", () => {
			const error = new TestException("Error");

			expect(isHttpAwareException(error)).toBe(false);
		});
	});

	describe("httpAwareException", () => {
		it("has httpStatus as class property", () => {
			const error = new HttpAwareTestException("Error");

			expect(error.httpStatus).toBe(400);
		});

		it("has headers as class property", () => {
			const error = new HttpAwareTestException("Error");

			expect(error.headers).toEqual({ "X-Custom": "value" });
		});

		it("is detected by isHttpAwareException", () => {
			const error = new HttpAwareTestException("Error");

			expect(isHttpAwareException(error)).toBe(true);
		});

		it("does not detect non-http-aware exceptions", () => {
			const error = new TestException("Error");

			expect(isHttpAwareException(error)).toBe(false);
		});

		it("does not detect plain errors", () => {
			expect(isHttpAwareException(new Error("test"))).toBe(false);
		});

		it("does not detect null or undefined", () => {
			expect(isHttpAwareException(null)).toBe(false);
			expect(isHttpAwareException(undefined)).toBe(false);
		});
	});
});
