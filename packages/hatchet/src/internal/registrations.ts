import type { Interceptor } from "../interceptor";
import type { AnyHostCtor } from "../references/shared";
import type { Type } from "@nestjs/common";

/**
 * Token class for feature registration discovery.
 * Each forFeature() call creates a provider with this class as token.
 */
export class HatchetFeatureRegistration {
	public constructor(public readonly refs: AnyHostCtor[]) {}
}

/**
 * Token class for interceptor registration.
 * Stores interceptor class references for later resolution via ModuleRef.
 */
export class InterceptorRegistration {
	public constructor(public readonly refs: Type<Interceptor>[]) {}
}
