import { HatchetClient } from "@hatchet-dev/typescript-sdk";
import { Injectable } from "@nestjs/common";

import { EVENT_MARKER } from "../events/event-definition.js";
import { createHostRunForAdmin } from "../execution/host-run/index.js";

import type { AnyEventDefinition, EventInput } from "../events/index.js";
import type { HostRunFn } from "../execution/index.js";

type EventClient = HatchetClient["events"];
type EventEmitOptions = Parameters<EventClient["push"]>[2];
type Event = Awaited<ReturnType<EventClient["push"]>>;

/**
 * Input accepted by {@link Client.emit} — a single event payload or an array of them.
 */
type EventEmitInput<E extends AnyEventDefinition> =
	| EventInput<E>
	| EventInput<E>[];

/**
 * Return type of {@link Client.emit}: an array of events when an array of inputs is
 * provided, otherwise a single event.
 */
type EventEmitReturn<
	E extends AnyEventDefinition,
	I extends EventEmitInput<E>,
> = I extends EventInput<E>[] ? Event[] : Event;

@Injectable()
export class Client {
	public readonly run: HostRunFn;

	public constructor(private readonly client: HatchetClient) {
		this.run = createHostRunForAdmin(client);
	}

	/**
	 * Access to the underlying HatchetClient SDK.
	 * Use for advanced features not wrapped by this library.
	 */
	public get sdk(): HatchetClient {
		return this.client;
	}

	/**
	 * Emit one or many events of the same type.
	 *
	 * Pass a single payload to emit one event, or an array of payloads to emit
	 * many at once. The return type adjusts accordingly: a single {@link Event}
	 * for a single input, or an array of {@link Event} for an array of inputs.
	 *
	 * @param event The event definition to emit.
	 * @param input A single event payload, or an array of payloads (each must
	 *   match the event's schema).
	 * @param options Optional emit configuration.
	 * @returns The emitted event, or an array of emitted events.
	 *
	 * @example
	 * ```typescript
	 * // Single event
	 * await client.emit(UserCreatedEvent, { userId: "123", email: "user@example.com" });
	 * ```
	 *
	 * @example
	 * ```typescript
	 * // Multiple events
	 * await client.emit(OrderPlacedEvent, [
	 *   { orderId: "1", userId: "123", total: 100 },
	 *   { orderId: "2", userId: "456", total: 200 },
	 * ]);
	 * ```
	 */
	public async emit<E extends AnyEventDefinition, I extends EventEmitInput<E>>(
		event: E,
		input: I,
		options?: EventEmitOptions,
	): Promise<EventEmitReturn<E, I>> {
		if (Array.isArray(input)) {
			if (input.length === 0) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-return
				return [] as any;
			}

			const result = await this.client.events.bulkPush(
				event.name,
				input.map((single) => ({
					payload: { ...(single as object), [EVENT_MARKER]: event.name },
					...(options?.additionalMetadata !== undefined && {
						additionalMetadata: options.additionalMetadata,
					}),
					...(options?.priority !== undefined && {
						priority: options.priority,
					}),
					...(options?.scope !== undefined && { scope: options.scope }),
				})),
				options,
			);

			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			return result.events as any;
		}

		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return (await this.client.events.push(
			event.name,
			{ ...(input as object), [EVENT_MARKER]: event.name },
			options,
		)) as any;
	}

	/**
	 * Emit multiple events of the same type.
	 *
	 * @deprecated Use {@link Client.emit} with an array of inputs instead. This
	 *   alias forwards to `emit` and will be removed in a future major version.
	 *
	 * @param event The event definition to emit.
	 * @param inputs Array of event payloads.
	 * @param options Optional emit configuration.
	 * @returns Array of emitted events.
	 */
	public async emitBulk<E extends AnyEventDefinition>(
		event: E,
		inputs: EventInput<E>[],
		options?: EventEmitOptions,
	): Promise<Event[]> {
		return await this.emit(event, inputs, options);
	}
}
