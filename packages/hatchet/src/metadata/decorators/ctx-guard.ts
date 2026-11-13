import type { DurableCtxMembers } from "../../execution/index.js";

/**
 * Method decorator that only accepts a durable ctx parameter when `Durable` is true,
 * and only a non-durable one otherwise. `Msg` is shown on mismatch.
 */
export type CtxGuard<Durable extends boolean, Msg extends string> = <
	F extends (...args: any[]) => any,
>(
	target: object,
	propertyKey: string | symbol,
	descriptor: TypedPropertyDescriptor<F> &
		((Parameters<F>[0] extends DurableCtxMembers ? true : false) extends Durable
			? unknown
			: { error: Msg }),
) => void;
