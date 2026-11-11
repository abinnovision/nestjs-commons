import { HatchetException } from "./hatchet.exception.js";

/**
 * Thrown when a durable task calls `ctx.run` with `wait: false`.
 * Durable child runs are always awaited so their result can be recorded.
 */
export class DurableRunNoWaitException extends HatchetException {
	public constructor() {
		super("Durable ctx.run does not support 'wait: false'");
	}
}
