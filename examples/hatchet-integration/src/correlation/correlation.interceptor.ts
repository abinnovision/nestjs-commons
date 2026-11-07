import { Interceptor } from "@abinnovision/nestjs-hatchet";
import { Injectable } from "@nestjs/common";

import { CORRELATION_ID_KEY, correlationStorage } from "./correlation.context";

import type { BaseCtx } from "@abinnovision/nestjs-hatchet";

/**
 * Example worker-side Interceptor that restores the correlation context from the
 * run's `additionalMetadata`, so code inside tasks (and further emits or runs)
 * sees the same correlation id as the original request.
 */
@Injectable()
export class CorrelationInterceptor extends Interceptor {
	public async intercept<T>(
		ctx: BaseCtx<any>,
		next: () => Promise<T>,
	): Promise<T> {
		const metadata = ctx.fromSDK.additionalMetadata() as Record<
			string,
			string | undefined
		>;
		const correlationId = metadata[CORRELATION_ID_KEY];

		if (correlationId === undefined) {
			return await next();
		}

		return await correlationStorage.run({ correlationId }, next);
	}
}
