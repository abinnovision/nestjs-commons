import { HatchetClient } from "@hatchet-dev/typescript-sdk";
import { Logger } from "@nestjs/common";

import { hatchetModuleConfigToken } from "../hatchet.module-config.js";

import type { HatchetModuleConfig } from "../hatchet.module-config.js";
import type { FactoryProvider } from "@nestjs/common";

type HatchetLogger = ReturnType<HatchetClient["config"]["logger"]>;

/**
 * Creates a logger that matches the Hatchet logger interface based on the given context.
 *
 * @param loggingContext The context to log under.
 */
const loggerFactory = (loggingContext: string): HatchetLogger => {
	// Create a child logger for each context.
	const logger = new Logger(`HatchetClient/${loggingContext}`);

	// / Create a logger that matches the Hatchet logger interface.
	return {
		debug: (message, extra) => {
			logger.debug(message, extra);
		},
		info: (message, extra) => {
			logger.log(message, extra);
		},
		green: (message, extra) => {
			logger.log(message, extra);
		},
		warn: (message, error, extra) => {
			logger.warn(message, { ...extra, err: error });
		},
		error: (message, error, extra) => {
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
	useFactory: (opts: HatchetModuleConfig) =>
		new HatchetClient({
			...opts.config,
			logger: loggerFactory,
		}),
};
