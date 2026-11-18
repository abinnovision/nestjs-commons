import { describe, expect, expectTypeOf, it } from "vitest";

import { AppException, isHttpAwareException } from "./app-exception.js";

import type {
	AppExceptionOptsWithoutMeta,
	ExceptionCode,
	ExceptionMeta,
	HttpAwareException,
} from "./app-exception.js";

class TestException extends AppException<{ field: string }> {
	public readonly code = "TEST__ERROR";
}

class HttpAwareTestException
	extends AppException
	implements HttpAwareException
{
	public readonly code = "TEST__HTTP_AWARE";
	public readonly httpStatus = 400;
	public readonly headers = { "X-Custom": "value" };
}

class EmailTakenException extends AppException<{ email: string }> {
	public readonly code = "USER__EMAIL_TAKEN";

	public constructor(email: string, opts?: AppExceptionOptsWithoutMeta) {
		super(`Email '${email}' is already taken`, { ...opts, meta: { email } });
	}
}

class SpecialEmailTakenException extends EmailTakenException {}

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

		it("defaults meta to an empty object", () => {
			const error = new HttpAwareTestException("Error");

			expect(error.meta).toEqual({});
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

	describe("types", () => {
		it("preserves the literal code", () => {
			expectTypeOf<
				ExceptionCode<typeof EmailTakenException>
			>().toEqualTypeOf<"USER__EMAIL_TAKEN">();
			expectTypeOf<ExceptionMeta<typeof EmailTakenException>>().toEqualTypeOf<{
				email: string;
			}>();
		});

		it("preserves the literal code on a subclass of a subclass", () => {
			expect(new SpecialEmailTakenException("a").code).toBe(
				"USER__EMAIL_TAKEN",
			);
			expectTypeOf<
				ExceptionCode<typeof SpecialEmailTakenException>
			>().toEqualTypeOf<"USER__EMAIL_TAKEN">();
			expectTypeOf<
				ExceptionMeta<typeof SpecialEmailTakenException>
			>().toEqualTypeOf<{ email: string }>();
		});

		it("resolves codes of a union", () => {
			expectTypeOf<
				ExceptionCode<typeof EmailTakenException | typeof TestException>
			>().toEqualTypeOf<"USER__EMAIL_TAKEN" | "TEST__ERROR">();
		});

		it("resolves the code of an abstract class", () => {
			expectTypeOf<
				ExceptionCode<typeof AppException>
			>().toEqualTypeOf<string>();
		});

		it("enforces the subclass constructor", () => {
			// Type-level only; never called.
			const _calls = () => [
				// @ts-expect-error missing email
				new EmailTakenException(),
				// @ts-expect-error wrong email type
				new EmailTakenException(1),
			];

			expectTypeOf(_calls).toBeFunction();
		});
	});
});
