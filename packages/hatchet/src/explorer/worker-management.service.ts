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
import { fromCtor } from "../metadata/accessor";

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

		// Only do orphan detection when enabled.
		// Defaults to 'true'.
		if (this.config.enableOrphanDetection ?? true) {
			// Fire-and-forget: detect orphan workflows without blocking startup.
			void this.detectOrphanWorkflows();
		}
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

	/**
	 * Detects workflows registered on the Hatchet server that have no
	 * corresponding local declaration. Logs a warning for each orphan found.
	 */
	private async detectOrphanWorkflows(): Promise<void> {
		try {
			const workerConfiguration = this.config.worker;
			if (!workerConfiguration) {
				return;
			}

			// Collect locally declared workflow/task names.
			const registrations = this.discoverFeatureRegistrations();
			const localNames = new Set(
				registrations.flatMap((r) => r.refs).map((ctor) => fromCtor(ctor).name),
			);

			if (localNames.size === 0) {
				return;
			}

			// Fetch all server-side workflows (paginated).
			const serverWorkflows = await this.fetchAllServerWorkflows();

			// Find orphans: on server but not locally declared.
			const orphans = serverWorkflows.filter((wf) => !localNames.has(wf));
			if (orphans.length === 0) {
				return;
			}

			// Log each orphan.
			for (const orphan of orphans) {
				WorkerManagementService.LOGGER.warn(
					`Workflow '${orphan}' exists remotely but has no local declaration.`,
				);
			}

			WorkerManagementService.LOGGER.warn(
				`Found ${String(orphans.length)} orphan workflow(s) with no local declaration.`,
			);
		} catch {
			// Never let orphan detection break the application.
			WorkerManagementService.LOGGER.debug(
				"Orphan workflow detection failed; skipping.",
			);
		}
	}

	/**
	 * Fetches all workflows registered on the Hatchet server using pagination.
	 *
	 * @returns An array of workflow names registered on the server.
	 */
	private async fetchAllServerWorkflows(): Promise<string[]> {
		const pageSize = 50;
		const maxPages = 10; // Safety limit: max 500 workflows
		const allWorkflows: string[] = [];
		let offset = 0;

		for (let page = 0; page < maxPages; page++) {
			const result = await this.client.workflows.list({
				offset,
				limit: pageSize,
			});

			const rows = result.rows ?? [];

			// Extract workflow names and accumulate.
			allWorkflows.push(...rows.map((it) => it.name));

			if (rows.length < pageSize) {
				break;
			}

			offset += pageSize;
		}

		return allWorkflows;
	}
}
