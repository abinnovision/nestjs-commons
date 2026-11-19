import { describe, expectTypeOf, it } from "vitest";

import { defaultExceptionMessages } from "./default-messages.js";
import { defineCatalog } from "../i18n.registry.js";

import type {
	EntityMessages,
	ExceptionMessages,
	ExceptionsOf,
} from "./exception-messages.js";
import type * as fixtures from "../__fixtures__/exceptions.js";
import type { EmailTakenException } from "../__fixtures__/exceptions.js";
import type { MessageValue } from "../i18n.registry.js";
import type { IcuParams } from "../internal/icu-params.js";
import type {
	EntityMutationFailedException,
	EntityNotFoundException,
} from "@abinnovision/nestjs-exceptions/entity";

type EmailMessages = ExceptionMessages<typeof EmailTakenException>;

type Messages = ExceptionMessages<
	typeof EmailTakenException | typeof EntityNotFoundException
>;

describe("exceptionMessages", () => {
	it("requires a message per exception code", () => {
		const catalog = defineCatalog({ greeting: "Hi" });
		// @ts-expect-error missing exceptions.USER__EMAIL_TAKEN
		const missing = catalog satisfies EmailMessages;

		expectTypeOf(missing).toBeObject();
		expectTypeOf<Messages>().toHaveProperty("exceptions.COMMON__NOT_FOUND");
	});

	it("accepts non-exception keys and keeps literal messages", () => {
		const en = defineCatalog({
			"exceptions.USER__EMAIL_TAKEN": "Email ''{email}'' is taken",
			greeting: "Hi {name}",
		}) satisfies EmailMessages;

		expectTypeOf(en.greeting).toEqualTypeOf<"Hi {name}">();
		expectTypeOf<
			IcuParams<(typeof en)["exceptions.USER__EMAIL_TAKEN"]>
		>().toEqualTypeOf<{ email: MessageValue }>();
	});

	it("collects the exception classes of a module", () => {
		expectTypeOf<ExceptionsOf<typeof fixtures>>().toEqualTypeOf<
			| typeof fixtures.EmailTakenException
			| typeof fixtures.ProtectedCtorException
		>();

		const catalog = defineCatalog({ greeting: "Hi" });
		// @ts-expect-error missing exceptions.USER__EMAIL_TAKEN
		const missing = catalog satisfies ExceptionMessages<
			ExceptionsOf<typeof fixtures>
		>;

		expectTypeOf(missing).toBeObject();
	});

	it("requires a message per entity name", () => {
		const catalog = { "entities.user": "User" };
		// @ts-expect-error missing entities.org
		const missing = catalog satisfies EntityMessages<"user" | "org">;

		expectTypeOf(missing).toBeObject();
		expectTypeOf<EntityMessages<"user">>().toEqualTypeOf<{
			"entities.user": string;
		}>();
	});

	it("requires nothing while EntityRegistry is not augmented", () => {
		expectTypeOf<EntityMessages>().toEqualTypeOf<Record<never, never>>();
	});

	it("covers the built-in exceptions and default codes", () => {
		const covered = defaultExceptionMessages satisfies ExceptionMessages<
			typeof EntityNotFoundException | typeof EntityMutationFailedException
		>;

		expectTypeOf(covered).toBeObject();
		expectTypeOf(defaultExceptionMessages).toHaveProperty(
			"exceptions.DEFAULT__INTERNAL_SERVER_ERROR",
		);
		expectTypeOf(defaultExceptionMessages).toHaveProperty(
			"exceptions.DEFAULT__MULTIPLE_ERRORS",
		);
	});
});
