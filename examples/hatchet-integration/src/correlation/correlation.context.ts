import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Metadata key used to carry the correlation id through Hatchet.
 */
export const CORRELATION_ID_KEY = "correlationId";

/**
 * Request-scoped storage holding the current correlation id.
 */
export const correlationStorage = new AsyncLocalStorage<{
	correlationId: string;
}>();

/**
 * Returns the correlation id of the current async context, if any.
 */
export const currentCorrelationId = (): string | undefined =>
	correlationStorage.getStore()?.correlationId;
