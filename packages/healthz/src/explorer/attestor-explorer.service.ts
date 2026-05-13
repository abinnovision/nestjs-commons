import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { DiscoveryService } from "@nestjs/core";

import { METADATA_KEY_HEALTH_ATTESTOR } from "../metadata/keys";

import type { HealthAttestor, HealthAttestorOptions } from "../health-attestor";
import type { RegisteredAttestor } from "../runner/attestor-runner.service";

/**
 * Discovers every provider annotated with `@HealthAttestor()` at
 * application bootstrap and exposes them as a flat list to the
 * aggregator service.
 *
 * Discovery uses NestJS' `DiscoveryService`, so attestors are picked
 * up regardless of which module they live in — as long as that module
 * is loaded into the application graph.
 */
@Injectable()
export class AttestorExplorer implements OnApplicationBootstrap {
	private static readonly LOGGER = new Logger(AttestorExplorer.name);

	private readonly attestors: RegisteredAttestor[] = [];

	public constructor(private readonly discovery: DiscoveryService) {}

	public onApplicationBootstrap(): void {
		const providers = this.discovery.getProviders();

		for (const wrapper of providers) {
			const { metatype } = wrapper;

			/*
			 * `DiscoveryService.getProviders()` returns every provider in the
			 * application graph — including value/factory providers and Nest
			 * internals whose `metatype` may be `null`, `undefined`, or a
			 * non-function token. `Reflect.getMetadata` throws `TypeError`
			 * unless the target is an object/function, so we skip anything
			 * that isn't a class constructor before touching it.
			 */
			if (typeof metatype !== "function") {
				continue;
			}

			const options = Reflect.getMetadata(
				METADATA_KEY_HEALTH_ATTESTOR,
				metatype,
			) as HealthAttestorOptions | undefined;

			if (options === undefined) {
				continue;
			}

			const instance = wrapper.instance as HealthAttestor | undefined | null;

			if (instance === undefined || instance === null) {
				continue;
			}

			if (typeof instance.check !== "function") {
				AttestorExplorer.LOGGER.warn(
					`Provider '${metatype.name}' is decorated with @HealthAttestor() but does not implement check()`,
				);

				continue;
			}

			this.attestors.push({ instance, options });
		}

		this.warnOnDuplicates();

		const names = this.attestors.map((a) => a.options.name).join(", ");
		const count = this.attestors.length.toString();

		AttestorExplorer.LOGGER.log(
			`Discovered ${count} health attestor(s)${
				names.length > 0 ? `: ${names}` : ""
			}`,
		);
	}

	public getAll(): readonly RegisteredAttestor[] {
		return this.attestors;
	}

	private warnOnDuplicates(): void {
		const seen = new Set<string>();
		const dupes = new Set<string>();

		for (const attestor of this.attestors) {
			if (seen.has(attestor.options.name)) {
				dupes.add(attestor.options.name);
			}

			seen.add(attestor.options.name);
		}

		if (dupes.size > 0) {
			AttestorExplorer.LOGGER.warn(
				`Duplicate attestor name(s) detected: ${[...dupes].join(
					", ",
				)}. Each will be invoked but reports may collide in dashboards.`,
			);
		}
	}
}
