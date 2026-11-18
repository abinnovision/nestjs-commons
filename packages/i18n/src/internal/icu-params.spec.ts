import { describe, expectTypeOf, it } from "vitest";

import type { IcuParams } from "./icu-params.js";
import type { MessageValue } from "../i18n.registry.js";

describe("icuParams", () => {
	it("extracts simple arguments", () => {
		expectTypeOf<IcuParams<"Hi {name}">>().toEqualTypeOf<{
			name: MessageValue;
		}>();
		expectTypeOf<IcuParams<"{ a } and {b}">>().toEqualTypeOf<{
			a: MessageValue;
			b: MessageValue;
		}>();
	});

	it("types formatted arguments", () => {
		expectTypeOf<IcuParams<"{n, number, ::currency/EUR}">>().toEqualTypeOf<{
			n: number;
		}>();
		expectTypeOf<IcuParams<"On {d, date, short}">>().toEqualTypeOf<{
			d: Date | number;
		}>();
		expectTypeOf<
			IcuParams<"{n, plural, one {# item} other {# items}}">
		>().toEqualTypeOf<{ n: number }>();
	});

	it("extracts nested select and plural arguments", () => {
		expectTypeOf<
			IcuParams<"{g, select, female {{n, plural, one {her item} other {her {n} items}}} other {{name}}}">
		>().toEqualTypeOf<{ g: string; n: number; name: MessageValue }>();
	});

	it("handles escaped apostrophes", () => {
		expectTypeOf<IcuParams<"It''s ''{id}''">>().toEqualTypeOf<{
			id: MessageValue;
		}>();
	});

	it("returns no params without arguments", () => {
		expectTypeOf<IcuParams<"Hello">>().toEqualTypeOf<Record<never, never>>();
	});

	it("falls back to loose params", () => {
		type Loose = Record<string, MessageValue>;

		expectTypeOf<IcuParams<string>>().toEqualTypeOf<Loose>();
		expectTypeOf<IcuParams<"Quoted '{brace}'">>().toEqualTypeOf<Loose>();
		expectTypeOf<IcuParams<"Broken {name">>().toEqualTypeOf<Loose>();
		expectTypeOf<IcuParams<"Stray } brace">>().toEqualTypeOf<Loose>();
	});
});
