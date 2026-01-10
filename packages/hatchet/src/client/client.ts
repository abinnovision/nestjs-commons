import { HatchetClient } from "@hatchet-dev/typescript-sdk";
import { PushEventOptions } from "@hatchet-dev/typescript-sdk/clients/event/event-client";
import { Injectable } from "@nestjs/common";

import { EVENT_MARKER } from "../events/event-definition";
import { createHostRunForAdmin } from "../execution/host-run";

import type { AnyEventDefinition, EventInput } from "../events";
import type { HostRunFn } from "../execution";
import type { Event } from "@hatchet-dev/typescript-sdk/protoc/events";

/**
 * Options for emitting events.
 */
type EmitOptions = PushEventOptions;

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
	 * Emit a single event.
	 *
	 * @param event The event definition to emit.
	 * @param input The event payload (must match the event's schema).
	 * @param options Optional emit configuration.
	 * @returns The emitted event.
	 *
	 * @example
	 * ```typescript
	 * await client.emit(UserCreatedEvent, { userId: "123", email: "user@example.com" });
	 * ```
	 */
	public async emit<E extends AnyEventDefinition>(
		event: E,
		input: EventInput<E>,
		options?: EmitOptions,
	): Promise<Event> {
		return await this.client.events.push(
			event.name,
			{ ...(input as object), [EVENT_MARKER]: event.name },
			options,
		);
	}

	/**
	 * Emit multiple events of the same type.
	 *
	 * @param event The event definition to emit.
	 * @param inputs Array of event payloads.
	 * @param options Optional emit configuration.
	 * @returns Array of emitted events.
	 *
	 * @example
	 * ```typescript
	 * await client.emitBulk(OrderPlacedEvent, [
	 *   { orderId: "1", userId: "123", total: 100 },
	 *   { orderId: "2", userId: "456", total: 200 },
	 * ]);
	 * ```
	 */
	public async emitBulk<E extends AnyEventDefinition>(
		event: E,
		inputs: EventInput<E>[],
		options?: EmitOptions,
	): Promise<Event[]> {
		if (inputs.length === 0) {
			return [];
		}

		const result = await this.client.events.bulkPush(
			event.name,
			inputs.map((input) => ({
				payload: { ...(input as object), [EVENT_MARKER]: event.name },
			})),
			options,
		);

		return result.events;
	}
}
