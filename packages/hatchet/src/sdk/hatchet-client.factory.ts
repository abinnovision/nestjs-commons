import { HatchetClient } from "@hatchet-dev/typescript-sdk";
import { Logger } from "@nestjs/common";

import { hatchetModuleConfigToken } from "../hatchet.module-config";

import type { HatchetModuleConfig } from "../hatchet.module-config";
import type { LogExtra } from "@hatchet-dev/typescript-sdk/util/logger";
import type { FactoryProvider } from "@nestjs/common";

/**
 * Creates a logger that matches the Hatchet logger interface based on the given context.
 *
 * @param loggingContext The context to log under.
 */
const loggerFactory = (loggingContext: string) => {
	// Create a child logger for each context.
	const logger = new Logger(`HatchetClient/${loggingContext}`);

	/// Create a logger that matches the Hatchet logger interface.
	return {
		debug: (message: string, extra?: LogExtra) => {
			logger.debug(message, extra);
		},
		info: (message: string, extra?: LogExtra) => {
			logger.log(message, extra);
		},
		green: (message: string, extra?: LogExtra) => {
			logger.log(message, extra);
		},
		warn: (message: string, error?: Error, extra?: LogExtra) => {
			logger.warn(message, { ...extra, err: error });
		},
		error: (message: string, error?: Error, extra?: LogExtra) => {
			logger.error(message, { ...extra, err: error });
		},
	};
};

/**
 * Factory provider for the HatchetClient.
 */
export const hatchetClientFactory: FactoryProvider = {
	provide: HatchetClient,
	inject: [hatchetModuleConfigToken],
	useFactory: (opts: HatchetModuleConfig) => {
		return new HatchetClient({
			...opts.config,
			logger: loggerFactory,
		});
	},
};
