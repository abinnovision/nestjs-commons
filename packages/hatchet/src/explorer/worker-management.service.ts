import { HatchetClient } from "@hatchet-dev/typescript-sdk";
import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { DiscoveryService } from "@nestjs/core";
import { InstanceWrapper } from "@nestjs/core/injector/instance-wrapper";

import { HatchetModuleWorkerRegistrationConfig } from "../hatchet.module-config";
import { TOKEN_HATCHET_WORKER_OPTS_PREFIX } from "../internal";
import { DeclarationBuilderService } from "./declaration-builder.service";
import { HostExplorerService } from "./host-explorer.service";

@Injectable()
export class WorkerManagementService implements OnApplicationBootstrap {
	private static LOGGER = new Logger(WorkerManagementService.name);

	// eslint-disable-next-line max-params
	public constructor(
		private readonly hostExplorer: HostExplorerService,
		private readonly discovery: DiscoveryService,
		private readonly client: HatchetClient,
		private readonly declarationBuilder: DeclarationBuilderService,
	) {}

	public async onApplicationBootstrap() {
		this.initWorkers();
	}

	private async initWorkers() {
		const workers = this.exploreDefinedWorkers();
		WorkerManagementService.LOGGER.debug(`Found ${workers.length} workers`);

		if (workers.length === 0) {
			return;
		}

		await Promise.all(workers.map((worker) => this.initWorker(worker)));
	}

	private async initWorker(
		worker: InstanceWrapper<HatchetModuleWorkerRegistrationConfig>,
	) {
		const configHostModule = worker.host;
		if (!configHostModule) {
			return;
		}

		const workerOpts = worker.instance;

		const workflows = await Promise.all(
			workerOpts.workflows.map((callableRef) => {
				const host = this.hostExplorer.getHostInModuleByRef(
					configHostModule,
					callableRef,
				);

				if (!host) {
					throw new Error(
						`Could not find host for workflow '${callableRef.host.name}'`,
					);
				}

				return this.declarationBuilder.createDeclaration(host);
			}),
		);

		// If there are no workflows, we don't need to initialize the worker.
		if (!workflows.length) {
			WorkerManagementService.LOGGER.debug(
				`No workflows found for worker '${workerOpts.name}'`,
			);
			return;
		}

		const workerObj = await this.client.worker(workerOpts.name, {
			...workerOpts.options,
			workflows,
		});

		WorkerManagementService.LOGGER.debug(
			`Initialized worker ${workerOpts.name}`,
		);

		// noinspection ES6MissingAwait
		workerObj.start();
	}

	/**
	 * Explores the defined workers in the application.
	 *
	 * @returns An array of worker configs.
	 */
	private exploreDefinedWorkers(): InstanceWrapper<HatchetModuleWorkerRegistrationConfig>[] {
		return this.discovery.getProviders().filter((wrapper) => {
			if (typeof wrapper.token !== "string") {
				return false;
			}

			return wrapper.token.startsWith(TOKEN_HATCHET_WORKER_OPTS_PREFIX);
		});
	}
}
