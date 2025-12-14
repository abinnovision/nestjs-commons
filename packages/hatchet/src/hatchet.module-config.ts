import type { CreateWorkerOpts } from "@hatchet-dev/typescript-sdk";
import type { ClientConfig } from "@hatchet-dev/typescript-sdk/clients/hatchet-client";

/**
 * Configuration for the HatchetModule.
 */
export interface HatchetModuleConfig {
	/**
	 * Configuration for the Hatchet client.
	 * Certain, internally managed options are omitted.
	 */
	config: Partial<Omit<ClientConfig, "logger" | "log_level">>;

	/**
	 * Name of the global worker.
	 */
	workerName: string;

	/**
	 * Optional configuration for the worker.
	 */
	workerOpts?: Omit<CreateWorkerOpts, "workflows">;
}

export const hatchetModuleConfigToken = Symbol("hatchet:module:config");
