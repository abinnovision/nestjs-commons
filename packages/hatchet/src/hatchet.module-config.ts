import type { AnyCallableRef } from "./ref";
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
}

export interface HatchetModuleWorkerRegistrationConfig {
	name: string;
	options?: Omit<CreateWorkerOpts, "workflows" | "handleKill">;
	workflows: AnyCallableRef[];
}

export const hatchetModuleConfigToken = Symbol("hatchet:module:config");
