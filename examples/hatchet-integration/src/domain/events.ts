import { defineEvent } from "@abinnovision/nestjs-hatchet";
import { z } from "zod";

/**
 * Event emitted when a user is created.
 */
export const UserCreatedEvent = defineEvent(
	"user:created",
	z.object({
		userId: z.string(),
		email: z.string().email(),
		createdAt: z.string().datetime(),
	}),
);

/**
 * Event emitted when an order is placed.
 */
export const OrderPlacedEvent = defineEvent(
	"order:placed",
	z.object({
		orderId: z.string(),
		userId: z.string(),
		total: z.number(),
		items: z.array(
			z.object({
				productId: z.string(),
				quantity: z.number(),
			}),
		),
	}),
);
