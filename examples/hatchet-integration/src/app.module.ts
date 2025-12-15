import { HatchetModule, taskRef } from "@abinnovision/nestjs-hatchet";
import { Module } from "@nestjs/common";
import "dotenv/config";

import { AdminModule } from "./admin/admin.module";
import { AppConfigx } from "./app.configx";
import { CleanupTask } from "./cleanup.task";
import { DomainModule } from "./domain/domain.module";
import { LoggingExecutionWrapper } from "./logging-execution-wrapper";

@Module({
	providers: [AppConfigx],
	imports: [
		HatchetModule.forRootAsync({
			inject: [AppConfigx],
			provideInjectionTokensFrom: [AppConfigx],
			useFactory: (config: AppConfigx) => ({
				config: {
					token: config.HATCHET_CLIENT_TOKEN,
					tls_config: { tls_strategy: "none" },
				},
				worker: { name: "common-worker" },
			}),
			// Pass the wrapper class - module handles provider registration
			executionWrapper: LoggingExecutionWrapper,
		}),
		HatchetModule.forFeature(taskRef(CleanupTask)),
		DomainModule,
		AdminModule,
	],
})
export class AppModule {}
