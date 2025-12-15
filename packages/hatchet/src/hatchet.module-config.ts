import type { CreateWorkerOpts } from "@hatchet-dev/typescript-sdk";
import type { ClientConfig } from "@hatchet-dev/typescript-sdk/clients/hatchet-client";

/**
 * Configuration for the Hatchet worker.
 */
type HatchetModuleWorkerConfig = { name: string } & Omit<
	CreateWorkerOpts,
	"workflows"
>;

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
	 * Configuration for the Hatchet worker.
	 * If undefined, the worker will not be started.
	 */
	worker: HatchetModuleWorkerConfig | undefined;
}

export const hatchetModuleConfigToken = Symbol("hatchet:module:config");
