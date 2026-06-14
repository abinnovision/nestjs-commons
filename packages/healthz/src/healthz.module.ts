import { Global, Module } from "@nestjs/common";
import { DiscoveryModule } from "@nestjs/core";

import { AttestorExplorer } from "./explorer/attestor-explorer.service.js";
import { HealthzController } from "./healthz.controller.js";
import { HealthzService } from "./healthz.service.js";
import { AttestorRunner } from "./runner/attestor-runner.service.js";

import type { DynamicModule } from "@nestjs/common";

/**
 * The healthz module — import once at the application root via
 * `HealthzModule.forRoot()` to mount the `/livez`, `/readyz`, and
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
 *     HealthzModule.forRoot(),
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
	 * Registers the healthz module globally.
	 *
	 * Takes no arguments today; reserved as the canonical entry point
	 * for any future module configuration.
	 */
	public static forRoot(): DynamicModule {
		return {
			module: HealthzModule,
			global: true,
		};
	}
}
