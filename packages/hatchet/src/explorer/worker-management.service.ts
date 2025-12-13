import { HatchetClient } from "@hatchet-dev/typescript-sdk";
import {
	Inject,
	Injectable,
	Logger,
	OnApplicationBootstrap,
} from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";

import {
	HatchetModuleConfig,
	hatchetModuleConfigToken,
} from "../hatchet.module-config";
import { HatchetFeatureRegistration } from "../internal";
import { DeclarationBuilderService } from "./declaration-builder.service";

@Injectable()
export class WorkerManagementService implements OnApplicationBootstrap {
	private static LOGGER = new Logger(WorkerManagementService.name);

	// eslint-disable-next-line max-params
	public constructor(
		private readonly client: HatchetClient,
		private readonly declarationBuilder: DeclarationBuilderService,
		@Inject(hatchetModuleConfigToken)
		private readonly config: HatchetModuleConfig,
		private readonly moduleRef: ModuleRef,
	) {}

	public async onApplicationBootstrap() {
		await this.initWorker();
	}

	private async initWorker() {
		const registrations = this.discoverFeatureRegistrations();

		const refCount = registrations.reduce((sum, r) => sum + r.refs.length, 0);

		WorkerManagementService.LOGGER.debug(
			`Found ${refCount} registered workflows/tasks`,
		);

		if (refCount === 0) {
			return;
		}

		const declarations = await this.buildDeclarations(registrations);

		const worker = await this.client.worker(this.config.workerName, {
			...this.config.workerOpts,
			workflows: declarations,
		});

		WorkerManagementService.LOGGER.debug(
			`Initialized worker '${this.config.workerName}'`,
		);

		// noinspection ES6MissingAwait
		worker.start();
	}

	/**
	 * Builds declarations from the discovered feature registrations.
	 */
	private async buildDeclarations(registrations: HatchetFeatureRegistration[]) {
		const allHosts = registrations.flatMap((it) => it.refs);

		const declarationPromises = allHosts.map((hostToken) => {
			const host = this.moduleRef.get(hostToken, { strict: false });

			if (!host) {
				throw new Error("Could not find module for feature registration");
			}

			return this.declarationBuilder.createDeclaration(host);
		});

		return await Promise.all(declarationPromises);
	}

	/**
	 * Discovers all feature registrations from forFeature() calls.
	 */
	private discoverFeatureRegistrations(): HatchetFeatureRegistration[] {
		return this.moduleRef.get(HatchetFeatureRegistration, {
			strict: false,
			each: true,
		});
	}
}
