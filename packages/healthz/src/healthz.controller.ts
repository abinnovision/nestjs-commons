import { Controller, Get, HttpStatus, Inject, Res } from "@nestjs/common";

import { HEALTHZ_MODULE_CONFIG_TOKEN } from "./healthz.module-config";
import { HealthzService } from "./healthz.service";

import type { HealthzModuleConfig } from "./healthz.module-config";

/**
 * Minimal structural shape covering both Express' `Response` and
 * Fastify's `FastifyReply`. Both expose a `.status(code)` method
 * returning a chainable reference, which is all this controller needs.
 *
 * Typing it structurally avoids pulling in a platform-specific peer
 * dependency.
 */
interface ResponseLike {
	status: (code: number) => unknown;
}

/**
 * Self-mounted controller exposing the three Kubernetes-style probes.
 *
 * - `GET /livez` — process liveness; runs no attestors, always 200.
 * - `GET /readyz` — readiness; runs every discovered attestor.
 * - `GET /healthz` — alias of `/readyz` (provided for clarity since
 *   the user-facing brief asked for `/healthz`).
 */
@Controller()
export class HealthzController {
	public constructor(
		private readonly service: HealthzService,
		@Inject(HEALTHZ_MODULE_CONFIG_TOKEN)
		private readonly config: HealthzModuleConfig,
	) {}

	@Get("livez")
	public livez(): { status: "ok"; timestamp: string } {
		return { status: "ok", timestamp: new Date().toISOString() };
	}

	@Get("readyz")
	public async readyz(
		@Res({ passthrough: true }) res: ResponseLike,
	): Promise<unknown> {
		return await this.respond(res);
	}

	@Get("healthz")
	public async healthz(
		@Res({ passthrough: true }) res: ResponseLike,
	): Promise<unknown> {
		return await this.respond(res);
	}

	private async respond(res: ResponseLike): Promise<unknown> {
		const report = await this.service.runAll();

		res.status(
			report.status === "down" ? HttpStatus.SERVICE_UNAVAILABLE : HttpStatus.OK,
		);

		const detail = this.config.detail ?? "full";

		if (detail === "none") {
			return undefined;
		}

		if (detail === "summary") {
			return { status: report.status, timestamp: report.timestamp };
		}

		return report;
	}
}
