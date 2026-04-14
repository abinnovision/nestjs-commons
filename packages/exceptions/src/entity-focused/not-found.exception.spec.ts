import { afterEach, describe, expect, it } from "vitest";

import {
	configureEntityNameRenderer,
	resetEntityNameRenderer,
} from "./entity-name-renderer";
import { NotFoundException } from "./not-found.exception";

describe("entity-focused/not-found.exception.ts", () => {
	afterEach(() => {
		resetEntityNameRenderer();
	});

	describe("notFoundException", () => {
		it("creates error with default renderer", () => {
			const error = new NotFoundException({
				entity: "user",
				entityId: "123",
			});

			expect(error.message).toBe("user with ID '123' not found");
		});

		it("creates error with configured renderer", () => {
			configureEntityNameRenderer({ user: "User Account" });

			const error = new NotFoundException({
				entity: "user",
				entityId: "123",
			});

			expect(error.message).toBe("User Account with ID '123' not found");
		});

		it("has correct code", () => {
			const error = new NotFoundException({
				entity: "user",
				entityId: "123",
			});

			expect(error.code).toBe("COMMON__NOT_FOUND");
		});

		it("has correct httpStatus", () => {
			const error = new NotFoundException({
				entity: "user",
				entityId: "123",
			});

			expect(error.httpStatus).toBe(404);
		});

		it("stores entity and entityId", () => {
			const error = new NotFoundException({
				entity: "user",
				entityId: "123",
			});

			expect(error.entity).toBe("user");
			expect(error.entityId).toBe("123");
		});

		it("stores entityDisplayName", () => {
			configureEntityNameRenderer({ user: "User" });

			const error = new NotFoundException({
				entity: "user",
				entityId: "123",
			});

			expect(error.entityDisplayName).toBe("User");
		});

		it("sets meta with entity info", () => {
			const error = new NotFoundException({
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
			const error = new NotFoundException(
				{ entity: "user", entityId: "123" },
				{ cause, sourcePointer: "/data/user" },
			);

			expect(error.cause).toBe(cause);
			expect(error.sourcePointer).toBe("/data/user");
		});
	});
});
