import { HatchetModule } from "@abinnovision/nestjs-hatchet";
import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import "dotenv/config";

import { AdminModule } from "./admin/admin.module";
import { AppConfigx } from "./app.configx";
import { CleanupTask } from "./cleanup.task";
import { CorrelationClientInterceptor } from "./correlation/correlation-client.interceptor";
import { CorrelationInterceptor } from "./correlation/correlation.interceptor";
import { CorrelationMiddleware } from "./correlation/correlation.middleware";
import { DomainModule } from "./domain/domain.module";
import { LoggingInterceptor } from "./logging-interceptor";

@Module({
	providers: [
		AppConfigx,
		CleanupTask,
		LoggingInterceptor,
		CorrelationInterceptor,
		CorrelationClientInterceptor,
	],
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

			/*
			 * Worker-side task interceptors. CorrelationInterceptor is outermost, so the
			 * LoggingInterceptor already sees the restored correlation id.
			 */
			taskInterceptors: [CorrelationInterceptor, LoggingInterceptor],

			// Producer-side interceptors for Client.emit and Client.run.
			clientInterceptors: [CorrelationClientInterceptor],
		}),
		HatchetModule.forFeature(CleanupTask),
		DomainModule,
		AdminModule,
	],
})
export class AppModule implements NestModule {
	public configure(consumer: MiddlewareConsumer) {
		consumer.apply(CorrelationMiddleware).forRoutes("*");
	}
}
