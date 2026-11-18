import { describe, expect, expectTypeOf, it } from "vitest";

import { EntityNotFoundException } from "./not-found.exception.js";

import type { ExceptionCode } from "../app-exception.js";
import type { EntityFocusedAppException } from "./entity-focused-app-exception.js";

describe("entity-focused/not-found.exception.ts", () => {
	describe("notFoundException", () => {
		it("creates error with raw entity name", () => {
			const error = new EntityNotFoundException({
				entity: "user",
				entityId: "123",
			});

			expect(error.message).toBe("user with ID '123' not found");
		});

		it("has correct code", () => {
			const error = new EntityNotFoundException({
				entity: "user",
				entityId: "123",
			});

			expect(error.code).toBe("COMMON__NOT_FOUND");
		});

		it("has correct httpStatus", () => {
			const error = new EntityNotFoundException({
				entity: "user",
				entityId: "123",
			});

			expect(error.httpStatus).toBe(404);
		});

		it("stores entity and entityId", () => {
			const error = new EntityNotFoundException({
				entity: "user",
				entityId: "123",
			});

			expect(error.entity).toBe("user");
			expect(error.entityId).toBe("123");
		});

		it("sets meta with entity info", () => {
			const error = new EntityNotFoundException({
				entity: "user",
				entityId: "123",
			});

			expect(error.meta).toEqual({
				entityName: "user",
				entityId: "123",
			});
		});

		it("accepts additional options", () => {
			const cause = new Error("DB error");
			const error = new EntityNotFoundException(
				{ entity: "user", entityId: "123" },
				{ cause, sourcePointer: "/data/user" },
			);

			expect(error.cause).toBe(cause);
			expect(error.sourcePointer).toBe("/data/user");
		});

		it("requires entityId", () => {
			// Type-level only; never called.
			const _create = () =>
				// @ts-expect-error missing entityId
				new EntityNotFoundException({ entity: "user" });

			expectTypeOf(_create).toBeFunction();
		});

		it("has literal code type", () => {
			expectTypeOf<
				ExceptionCode<typeof EntityNotFoundException>
			>().toEqualTypeOf<"COMMON__NOT_FOUND">();
			expectTypeOf<
				ExceptionCode<typeof EntityFocusedAppException>
			>().toEqualTypeOf<string>();
		});

		it("rejects overriding the built-in code", () => {
			class OtherException extends EntityNotFoundException {
				// @ts-expect-error built-in code is a literal type
				public override readonly code = "OTHER__CODE";
			}

			expect(new OtherException({ entity: "user", entityId: "1" }).code).toBe(
				"OTHER__CODE",
			);
		});
	});
});
