import { ClientInterceptor } from "@abinnovision/nestjs-hatchet";
import { Injectable } from "@nestjs/common";

import {
	CORRELATION_ID_KEY,
	currentCorrelationId,
} from "./correlation.context";

import type {
	EmitCtx,
	EmitOptions,
	RunCtx,
	RunOptions,
} from "@abinnovision/nestjs-hatchet";

/**
 * Example ClientInterceptor that adds the current correlation id to the
 * `additionalMetadata` of every emitted event and every run started via `Client`.
 * Metadata passed by the caller takes precedence.
 */
@Injectable()
export class CorrelationClientInterceptor extends ClientInterceptor {
	public override async interceptEmit(
		ctx: EmitCtx,
		next: (options?: EmitOptions) => Promise<unknown>,
	) {
		const correlationId = currentCorrelationId();
		if (correlationId === undefined) {
			return await next();
		}

		return await next({
			...ctx.options,
			additionalMetadata: {
				[CORRELATION_ID_KEY]: correlationId,
				...ctx.options?.additionalMetadata,
			},
		});
	}

	public override async interceptRun(
		ctx: RunCtx,
		next: (options?: RunOptions) => Promise<unknown>,
	) {
		const correlationId = currentCorrelationId();
		if (correlationId === undefined) {
			return await next();
		}

		return await next({
			...ctx.options,
			additionalMetadata: {
				[CORRELATION_ID_KEY]: correlationId,
				...ctx.options?.additionalMetadata,
			},
		});
	}
}
