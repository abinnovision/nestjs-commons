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
import { DeclarationBuilderService } from "./declaration-builder.service";
import { HatchetFeatureRegistration } from "../internal/registrations";

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
		const workerConfiguration = this.config.worker;
		if (!workerConfiguration) {
			// If there is no worker configuration, then the worker is disabled.
			return;
		}

		const registrations = this.discoverFeatureRegistrations();

		const refCount = registrations.reduce((sum, r) => sum + r.refs.length, 0);

		WorkerManagementService.LOGGER.debug(
			`Found ${String(refCount)} workflows/tasks`,
		);

		if (refCount === 0) {
			return;
		}

		const { name, ...otherWorkerOptions } = workerConfiguration;
		const declarations = this.buildDeclarations(registrations);

		// Initialize and start the worker
		const worker = await this.client.worker(name, {
			...otherWorkerOptions,
			workflows: declarations,
		});

		WorkerManagementService.LOGGER.debug(`Initialized worker '${name}'`);

		// Start the worker. This is intentionally not awaited as the Promise resolves
		// only when it's stopped.
		void worker.start();
	}

	/**
	 * Builds declarations from the discovered feature registrations.
	 */
	private buildDeclarations(registrations: HatchetFeatureRegistration[]) {
		const allHosts = registrations.flatMap((it) => it.refs);

		return allHosts.map((hostToken) => {
			const host = this.moduleRef.get(hostToken, { strict: false });

			return this.declarationBuilder.createDeclaration(host);
		});
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
