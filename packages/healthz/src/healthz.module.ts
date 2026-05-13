import { Global, Module } from "@nestjs/common";
import { DiscoveryModule } from "@nestjs/core";

import { AttestorExplorer } from "./explorer/attestor-explorer.service";
import { HealthzController } from "./healthz.controller";
import { HEALTHZ_MODULE_CONFIG_TOKEN } from "./healthz.module-config";
import { HealthzService } from "./healthz.service";
import { AttestorRunner } from "./runner/attestor-runner.service";

import type { HealthzModuleConfig } from "./healthz.module-config";
import type { DynamicModule } from "@nestjs/common";

/**
 * The healthz module — import once at the application root via
 * `HealthzModule.forRoot({})` to mount the `/livez`, `/readyz`, and
 * `/healthz` endpoints and enable discovery of `@HealthAttestor()`
 * providers across the application graph.
 *
 * The module is registered as `global: true` so attestors declared in
 * feature modules are automatically picked up without any of those
 * modules needing to import `HealthzModule` themselves.
 *
 * @example
 * ```ts
 * @Module({
 *   imports: [
 *     DatabaseModule,
 *     HealthzModule.forRoot({}),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Global()
@Module({
	imports: [DiscoveryModule],
	controllers: [HealthzController],
	providers: [HealthzService, AttestorExplorer, AttestorRunner],
})
export class HealthzModule {
	/**
	 * Registers the healthz module globally and binds its configuration.
	 *
	 * All fields of `config` are optional — `forRoot({})` is the
	 * minimal call to accept every default.
	 */
	public static forRoot(config: HealthzModuleConfig): DynamicModule {
		return {
			module: HealthzModule,
			global: true,
			providers: [
				{
					provide: HEALTHZ_MODULE_CONFIG_TOKEN,
					useValue: config,
				},
			],
		};
	}
}
