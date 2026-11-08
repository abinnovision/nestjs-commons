import { describe, expect, it } from "vitest";

import { hatchetModuleConfigToken } from "./hatchet.module-config.js";
import { HatchetModule } from "./hatchet.module.js";
import { Interceptor, TaskInterceptor } from "./interceptor/index.js";
import { InterceptorRegistration } from "./internal/registrations.js";

import type { BaseCtx } from "./execution/index.js";
import type { Type } from "@nestjs/common";

class A extends TaskInterceptor {
	public intercept<T>(_ctx: BaseCtx<any>, next: () => Promise<T>) {
		return next();
	}
}

class B extends A {}

// eslint-disable-next-line @typescript-eslint/no-deprecated
class Legacy extends Interceptor {
	public intercept<T>(_ctx: BaseCtx<any>, next: () => Promise<T>) {
		return next();
	}
}

const providers = (extras: {
	interceptors?: Type<TaskInterceptor>[];
	taskInterceptors?: Type<TaskInterceptor>[];
}) => HatchetModule.forRoot({ config: {}, ...extras }).providers ?? [];

const registrationRefs = (extras: Parameters<typeof providers>[0]) =>
	(
		providers(extras).find(
			(p: any) => p.provide === InterceptorRegistration,
		) as any
	)?.useValue.refs;

describe("hatchetModule task interceptors", () => {
	it("concatenates interceptors before taskInterceptors", () => {
		expect(
			registrationRefs({ interceptors: [A], taskInterceptors: [B] }),
		).toEqual([A, B]);
	});

	it("registers taskInterceptors only", () => {
		expect(registrationRefs({ taskInterceptors: [B] })).toEqual([B]);
	});

	it("keeps the deprecated Interceptor alias identical to TaskInterceptor", () => {
		// eslint-disable-next-line @typescript-eslint/no-deprecated
		expect(Interceptor).toBe(TaskInterceptor);
		expect(new Legacy()).toBeInstanceOf(TaskInterceptor);
		expect(registrationRefs({ taskInterceptors: [Legacy] })).toEqual([Legacy]);
	});

	it("does not leak interceptor options into the config provider", () => {
		const config = (
			providers({ interceptors: [A], taskInterceptors: [B] }).find(
				(p: any) => p.provide === hatchetModuleConfigToken,
			) as any
		)?.useValue;

		expect(config).toBeDefined();
		expect(config).not.toHaveProperty("interceptors");
		expect(config).not.toHaveProperty("taskInterceptors");
	});
});
