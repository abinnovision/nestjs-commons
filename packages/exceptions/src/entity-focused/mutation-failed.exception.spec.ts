import { describe, expect, expectTypeOf, it } from "vitest";

import { EntityMutationFailedException } from "./mutation-failed.exception.js";

import type { EntityFocusedMeta } from "./entity-focused.interface.js";
import type { EntityMutationType } from "./mutation-failed.exception.js";

describe("entity-focused/mutation-failed.exception.ts", () => {
	describe("mutationFailedException", () => {
		it("creates error for create mutation", () => {
			const error = new EntityMutationFailedException({
				entity: "user",
				entityId: "123",
				mutationType: "create",
			});

			expect(error.message).toBe("Failed to create user with ID '123'");
		});

		it("creates error for update mutation", () => {
			const error = new EntityMutationFailedException({
				entity: "user",
				entityId: "123",
				mutationType: "update",
			});

			expect(error.message).toBe("Failed to update user with ID '123'");
		});

		it("creates error for delete mutation", () => {
			const error = new EntityMutationFailedException({
				entity: "user",
				entityId: "123",
				mutationType: "delete",
			});

			expect(error.message).toBe("Failed to delete user with ID '123'");
		});

		it("has correct code", () => {
			const error = new EntityMutationFailedException({
				entity: "user",
				entityId: "123",
				mutationType: "create",
			});

			expect(error.code).toBe("COMMON__MUTATION_FAILED");
		});

		it("has correct httpStatus", () => {
			const error = new EntityMutationFailedException({
				entity: "user",
				entityId: "123",
				mutationType: "create",
			});

			expect(error.httpStatus).toBe(400);
		});

		it("stores mutationType", () => {
			const error = new EntityMutationFailedException({
				entity: "user",
				entityId: "123",
				mutationType: "delete",
			});

			expect(error.mutationType).toBe("delete");
		});

		it("stores entity and entityId", () => {
			const error = new EntityMutationFailedException({
				entity: "user",
				entityId: "123",
				mutationType: "create",
			});

			expect(error.entity).toBe("user");
			expect(error.entityId).toBe("123");
		});

		it("sets meta with entity info", () => {
			const error = new EntityMutationFailedException({
				entity: "user",
				entityId: "123",
				mutationType: "create",
			});

			expect(error.meta).toEqual({
				entityName: "user",
				entityId: "123",
				mutationType: "create",
			});
		});

		it("has typed meta", () => {
			const error = new EntityMutationFailedException({
				entity: "user",
				entityId: "123",
				mutationType: "create",
			});

			expectTypeOf(error.meta).toEqualTypeOf<
				EntityFocusedMeta & { mutationType: EntityMutationType }
			>();
		});
	});
});
