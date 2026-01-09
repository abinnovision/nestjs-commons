import {
	Host,
	WorkflowCtx,
	workflowHost,
	WorkflowTask,
} from "@abinnovision/nestjs-hatchet";

import { OrderPlacedEvent, UserCreatedEvent } from "./events";

/**
 * Workflow that handles user and order events.
 * Demonstrates event-driven workflow with type guards for different event types.
 */
@Host({
	name: "event-handler",
	onEvents: ["user:created", "order:placed"],
})
export class EventHandlerWorkflow extends workflowHost() {
	@WorkflowTask<typeof EventHandlerWorkflow>({ parents: [] })
	public handleEvent(ctx: WorkflowCtx<typeof this>) {
		if (ctx.isRun()) {
			console.log(
				"[EventHandler] Workflow triggered by direct run, not an event.",
			);
			return {
				eventType: "run" as const,
				message: "Workflow executed via direct run.",
			};
		}

		// Use type guards to determine which event triggered this workflow
		if (ctx.isEvent(UserCreatedEvent)) {
			// ctx.input is now typed as { userId, email, createdAt, __event_name }
			console.log(`[EventHandler] New user created: ${ctx.input.email}`);

			return {
				eventType: "user:created" as const,
				userId: ctx.input.userId,
				message: `Processed user creation for ${ctx.input.email}`,
			};
		}

		if (ctx.isEvent(OrderPlacedEvent)) {
			// ctx.input is now typed as { orderId, userId, total, items, __event_name }
			console.log(
				`[EventHandler] Order placed: ${ctx.input.orderId} for $${String(ctx.input.total)}`,
			);

			return {
				eventType: "order:placed" as const,
				orderId: ctx.input.orderId,
				message: `Processed order ${ctx.input.orderId} with ${String(ctx.input.items.length)} items`,
			};
		}

		// Unknown event type
		console.log("[EventHandler] Unknown event type received");
		return {
			eventType: "unknown" as const,
			message: "Unknown event received",
		};
	}

	@WorkflowTask<typeof EventHandlerWorkflow>({ parents: ["handleEvent"] })
	public async notifyUser(ctx: WorkflowCtx<typeof this>) {
		// eslint-disable-next-line @typescript-eslint/unbound-method
		const parent = await ctx.parent(this.handleEvent);

		console.log(`[EventHandler] Sending notification: ${parent.message}`);

		return {
			notified: true,
			eventType: parent.eventType,
		};
	}
}
