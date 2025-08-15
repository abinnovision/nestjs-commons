import { ConfigurableModuleBuilder, Global, Module } from "@nestjs/common";
import { DiscoveryModule } from "@nestjs/core";

import { DeclarationBuilderService } from "./explorer/declaration-builder.service";
import { HostExplorerService } from "./explorer/host-explorer.service";
import { WorkerManagementService } from "./explorer/worker-management.service";
import { hatchetClientFactory } from "./hatchet-client";
import {
	HatchetModuleConfig,
	hatchetModuleConfigToken,
} from "./hatchet.module-config";

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
		HostExplorerService,
		DeclarationBuilderService,
		WorkerManagementService,
	],
})
export class HatchetCoreModule extends ConfigurableModuleClass {}
