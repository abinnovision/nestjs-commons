import { HatchetException } from "./hatchet.exception.js";

/**
 * Thrown when a durable task calls `ctx.run` on an engine without durable
 * eviction support. Child runs cannot be recorded in the durable event log
 * there, so they would be spawned again on replay.
 */
export class DurableEvictionNotSupportedException extends HatchetException {
	public constructor() {
		super(
			"Durable ctx.run requires a Hatchet engine with durable eviction support (>= v0.80.0). An unknown engine version is treated as unsupported. Use ctx.fromSDK.spawnChild to bypass this check.",
		);
	}
}
