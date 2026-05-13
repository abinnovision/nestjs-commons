import { afterEach, describe, expect, it } from "vitest";

import {
	configureEntityNameRenderer,
	resetEntityNameRenderer,
} from "./entity-name-renderer";
import { MutationFailedException } from "./mutation-failed.exception";

describe("entity-focused/mutation-failed.exception.ts", () => {
	afterEach(() => {
		resetEntityNameRenderer();
	});

	describe("mutationFailedException", () => {
		it("creates error for create mutation", () => {
			const error = new MutationFailedException({
				entity: "user",
				entityId: "123",
				mutationType: "create",
			});

			expect(error.message).toBe("Failed to create user with ID '123'");
		});

		it("creates error for update mutation", () => {
			const error = new MutationFailedException({
				entity: "user",
				entityId: "123",
				mutationType: "update",
			});

			expect(error.message).toBe("Failed to update user with ID '123'");
		});

		it("creates error for delete mutation", () => {
			const error = new MutationFailedException({
				entity: "user",
				entityId: "123",
				mutationType: "delete",
			});

			expect(error.message).toBe("Failed to delete user with ID '123'");
		});

		it("creates error with configured renderer", () => {
			configureEntityNameRenderer({ user: "User" });

			const error = new MutationFailedException({
				entity: "user",
				entityId: "123",
				mutationType: "update",
			});

			expect(error.message).toBe("Failed to update User with ID '123'");
		});

		it("has correct code", () => {
			const error = new MutationFailedException({
				entity: "user",
				entityId: "123",
				mutationType: "create",
			});

			expect(error.code).toBe("COMMON__MUTATION_FAILED");
		});

		it("has correct httpStatus", () => {
			const error = new MutationFailedException({
				entity: "user",
				entityId: "123",
				mutationType: "create",
			});

			expect(error.httpStatus).toBe(400);
		});

		it("stores mutationType", () => {
			const error = new MutationFailedException({
				entity: "user",
				entityId: "123",
				mutationType: "delete",
			});

			expect(error.mutationType).toBe("delete");
		});

		it("stores entity and entityId", () => {
			const error = new MutationFailedException({
				entity: "user",
				entityId: "123",
				mutationType: "create",
			});

			expect(error.entity).toBe("user");
			expect(error.entityId).toBe("123");
		});

		it("sets meta with entity info", () => {
			const error = new MutationFailedException({
				entity: "user",
				entityId: "123",
				mutationType: "create",
			});

			expect(error.meta).toEqual({
				entityName: "user",
				entityId: "123",
			});
		});
	});
});
