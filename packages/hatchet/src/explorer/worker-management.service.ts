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
			`Found ${String(refCount)} registered workflows/tasks`,
		);

		if (refCount === 0) {
			return;
		}

		const declarations = this.buildDeclarations(registrations);

		const worker = await this.client.worker(this.config.workerName, {
			...this.config.workerOpts,
			workflows: declarations,
		});

		WorkerManagementService.LOGGER.debug(
			`Initialized worker '${this.config.workerName}'`,
		);

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
