import { ConfigxModule } from "@abinnovision/nestjs-configx";
import { HatchetModule, taskRef } from "@abinnovision/nestjs-hatchet";
import { Module } from "@nestjs/common";
import "dotenv/config";

import { AdminModule } from "./admin/admin.module";
import { AppConfigx } from "./app.configx";
import { CleanupTask } from "./cleanup.task";
import { DomainModule } from "./domain/domain.module";

@Module({
	imports: [
		HatchetModule.forRootAsync({
			imports: [ConfigxModule.register(AppConfigx)],
			inject: [AppConfigx],
			useFactory: (config: AppConfigx) => ({
				config: {
					token: config.HATCHET_CLIENT_TOKEN,
					tls_config: { tls_strategy: "none" },
				},
			}),
		}),
		HatchetModule.registerWorker({
			name: "common-worker",
			workflows: [taskRef(CleanupTask)],
		}),
		DomainModule,
		AdminModule,
	],
})
export class AppModule {}
