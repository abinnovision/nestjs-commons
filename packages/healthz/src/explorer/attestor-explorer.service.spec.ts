import "reflect-metadata";
import { describe, expect, it } from "vitest";

import { HealthAttestor } from "../health-attestor";
import { AttestorExplorer } from "./attestor-explorer.service";

import type {
	HealthAttestor as HealthAttestorContract,
	HealthCheckOutcome,
} from "../health-attestor";
import type { DiscoveryService } from "@nestjs/core";

interface FakeProvider {
	instance: unknown;
	metatype: unknown;
}

const stubDiscovery = (providers: FakeProvider[]): DiscoveryService =>
	({
		getProviders: (): FakeProvider[] => providers,
	}) as unknown as DiscoveryService;

describe("explorer/attestor-explorer.service.ts", () => {
	describe("attestorExplorer.onApplicationBootstrap()", () => {
		it("collects providers decorated with @HealthAttestor()", () => {
			@HealthAttestor({ name: "db" })
			class Db implements HealthAttestorContract {
				public check(): HealthCheckOutcome {
					return { status: "ok" };
				}
			}

			@HealthAttestor({ name: "redis", critical: false })
			class Redis implements HealthAttestorContract {
				public check(): HealthCheckOutcome {
					return { status: "ok" };
				}
			}

			const dbInstance = new Db();
			const redisInstance = new Redis();
			const explorer = new AttestorExplorer(
				stubDiscovery([
					{ instance: dbInstance, metatype: Db },
					{ instance: redisInstance, metatype: Redis },
				]),
			);

			explorer.onApplicationBootstrap();
			const all = explorer.getAll();

			expect(all).toHaveLength(2);
			expect(all[0]?.options.name).toBe("db");
			expect(all[0]?.instance).toBe(dbInstance);
			expect(all[1]?.options).toEqual({ name: "redis", critical: false });
			expect(all[1]?.instance).toBe(redisInstance);
		});

		it("skips providers without @HealthAttestor() metadata", () => {
			class Plain {
				public check(): HealthCheckOutcome {
					return { status: "ok" };
				}
			}

			const explorer = new AttestorExplorer(
				stubDiscovery([{ instance: new Plain(), metatype: Plain }]),
			);

			explorer.onApplicationBootstrap();

			expect(explorer.getAll()).toHaveLength(0);
		});

		it("skips providers with no instance (deferred / failed)", () => {
			@HealthAttestor({ name: "deferred" })
			class Deferred implements HealthAttestorContract {
				public check(): HealthCheckOutcome {
					return { status: "ok" };
				}
			}

			const explorer = new AttestorExplorer(
				stubDiscovery([{ instance: null, metatype: Deferred }]),
			);

			explorer.onApplicationBootstrap();

			expect(explorer.getAll()).toHaveLength(0);
		});

		it("skips providers without a metatype (factory-only providers)", () => {
			const explorer = new AttestorExplorer(
				stubDiscovery([{ instance: { check: () => null }, metatype: null }]),
			);

			explorer.onApplicationBootstrap();

			expect(explorer.getAll()).toHaveLength(0);
		});

		it("warns and skips a decorated class missing check()", () => {
			@HealthAttestor({ name: "broken" })
			class Broken {
				public notACheck(): void {}
			}

			const explorer = new AttestorExplorer(
				stubDiscovery([{ instance: new Broken(), metatype: Broken }]),
			);

			explorer.onApplicationBootstrap();

			expect(explorer.getAll()).toHaveLength(0);
		});
	});
});
