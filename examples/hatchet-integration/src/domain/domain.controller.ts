import { Client, workflowRef } from "@abinnovision/nestjs-hatchet";
import { Controller, Get, Post, Body } from "@nestjs/common";

import { OrderPlacedEvent, UserCreatedEvent } from "./events";
import { ProcessDataWorkflow } from "./process-data.task";

@Controller("domain")
export class DomainController {
	public constructor(private readonly client: Client) {}

	@Get("process-data")
	public async processData(data: string) {
		return await this.client.run(
			workflowRef(ProcessDataWorkflow),
			{ data },
			{ wait: true },
		);
	}

	/**
	 * Emit a user:created event.
	 * This will trigger the EventHandlerWorkflow.
	 */
	@Post("events/user-created")
	public async emitUserCreated(
		@Body() body: { userId: string; email: string },
	) {
		const event = await this.client.emit(UserCreatedEvent, {
			userId: body.userId,
			email: body.email,
			createdAt: new Date().toISOString(),
		});

		return {
			message: "User created event emitted",
			eventId: event.eventId,
		};
	}

	/**
	 * Emit an order:placed event.
	 * This will trigger the EventHandlerWorkflow.
	 */
	@Post("events/order-placed")
	public async emitOrderPlaced(
		@Body()
		body: {
			orderId: string;
			userId: string;
			total: number;
			items: { productId: string; quantity: number }[];
		},
	) {
		const event = await this.client.emit(OrderPlacedEvent, {
			orderId: body.orderId,
			userId: body.userId,
			total: body.total,
			items: body.items,
		});

		return {
			message: "Order placed event emitted",
			eventId: event.eventId,
		};
	}

	/**
	 * Emit multiple order events at once.
	 */
	@Post("events/orders-bulk")
	public async emitOrdersBulk(
		@Body()
		body: {
			orders: {
				orderId: string;
				userId: string;
				total: number;
				items: { productId: string; quantity: number }[];
			}[];
		},
	) {
		const events = await this.client.emitBulk(OrderPlacedEvent, body.orders);

		return {
			message: `${events.length} order events emitted`,
			eventIds: events.map((e) => e.eventId),
		};
	}
}
