import { ConfigurableModuleBuilder, Global, Module } from "@nestjs/common";
import { DiscoveryModule } from "@nestjs/core";

import { Client } from "./client";
import { DeclarationBuilderService } from "./explorer/declaration-builder.service";
import { HostExplorerService } from "./explorer/host-explorer.service";
import { WorkerManagementService } from "./explorer/worker-management.service";
import {
	HatchetModuleConfig,
	hatchetModuleConfigToken,
} from "./hatchet.module-config";
import { hatchetClientFactory } from "./sdk";

const { ConfigurableModuleClass } =
	new ConfigurableModuleBuilder<HatchetModuleConfig>({
		optionsInjectionToken: hatchetModuleConfigToken,
		moduleName: "HatchetCoreModule",
	})
		.setClassMethodName("forRoot")
		.setExtras({}, (def) => ({
			...def,
			global: true,
		}))
		.build();

@Global()
@Module({
	imports: [DiscoveryModule],
	providers: [
		hatchetClientFactory,
		Client,
		HostExplorerService,
		DeclarationBuilderService,
		WorkerManagementService,
	],
	exports: [Client],
})
export class HatchetCoreModule extends ConfigurableModuleClass {}
