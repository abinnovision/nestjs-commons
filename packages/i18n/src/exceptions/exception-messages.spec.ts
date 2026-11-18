import { describe, expectTypeOf, it } from "vitest";

import { defineCatalog } from "../i18n.registry.js";

import type { ExceptionMessages } from "./exception-messages.js";
import type { EmailTakenException } from "../__fixtures__/exceptions.js";
import type { MessageValue } from "../i18n.registry.js";
import type { IcuParams } from "../internal/icu-params.js";
import type { EntityNotFoundException } from "@abinnovision/nestjs-exceptions/entity";

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
});
