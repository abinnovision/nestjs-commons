import { describe, expect, it, vi } from "vitest";

import { chainWithOptions } from "./chain.js";

interface Ctx {
	readonly options: { tags: string[] } | undefined;
}

describe("interceptor/chain.ts", () => {
	it("invokes layers in array order with the first as outermost", async () => {
		const calls: string[] = [];
		const layer =
			(name: string) => async (_ctx: Ctx, next: () => Promise<unknown>) => {
				calls.push(`${name}:before`);
				const result = await next();
				calls.push(`${name}:after`);

				return result;
			};

		await chainWithOptions<Ctx>(
			{ options: undefined },
			[layer("a"), layer("b")],
			() => {
				calls.push("terminal");

				return Promise.resolve();
			},
		);

		expect(calls).toEqual([
			"a:before",
			"b:before",
			"terminal",
			"b:after",
			"a:after",
		]);
	});

	it("passes the options given to next() as ctx.options of the inner layer", async () => {
		const inner = vi.fn((_ctx: Ctx, next: () => Promise<unknown>) => next());

		await chainWithOptions<Ctx>(
			{ options: { tags: ["caller"] } },
			[(_ctx, next) => next({ tags: ["outer"] }), inner],
			() => Promise.resolve(),
		);

		expect(inner.mock.calls[0]?.[0].options).toEqual({ tags: ["outer"] });
	});

	it("keeps the current options when next() is called without arguments", async () => {
		const options = { tags: ["caller"] };
		const inner = vi.fn((_ctx: Ctx, next: () => Promise<unknown>) => next());

		await chainWithOptions<Ctx>(
			{ options },
			[(_ctx, next) => next(), inner],
			() => Promise.resolve(),
		);

		expect(inner.mock.calls[0]?.[0].options).toBe(options);
	});

	it("treats next(undefined) like next()", async () => {
		const options = { tags: ["caller"] };
		const terminal = vi.fn(() => Promise.resolve());

		await chainWithOptions<Ctx>(
			{ options },
			[(_ctx, next) => next(undefined)],
			terminal,
		);

		expect(terminal).toHaveBeenCalledWith(options);
	});

	it("calls the terminal with the final options", async () => {
		const terminal = vi.fn(() => Promise.resolve("done"));

		const result = await chainWithOptions<Ctx>(
			{ options: { tags: ["caller"] } },
			[
				(_ctx, next) => next({ tags: ["a"] }),
				(_ctx, next) => next({ tags: ["b"] }),
			],
			terminal,
		);

		expect(terminal).toHaveBeenCalledWith({ tags: ["b"] });
		expect(result).toBe("done");
	});

	it("calls the terminal directly when there are no layers", async () => {
		const options = { tags: ["caller"] };
		const terminal = vi.fn(() => Promise.resolve());

		await chainWithOptions<Ctx>({ options }, [], terminal);

		expect(terminal).toHaveBeenCalledWith(options);
	});
});
