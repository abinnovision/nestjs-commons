import "reflect-metadata";
import { describe, expect, it } from "vitest";

import { HealthAttestor } from "./health-attestor.js";
import { METADATA_KEY_HEALTH_ATTESTOR } from "./metadata/keys.js";

import type {
	HealthAttestor as HealthAttestorContract,
	HealthAttestorOptions,
	HealthCheckOutcome,
} from "./health-attestor.js";

describe("health-attestor.ts", () => {
	describe("@HealthAttestor()", () => {
		it("stores its options as reflect metadata on the class", () => {
			const options: HealthAttestorOptions = {
				name: "database",
				critical: true,
				minIntervalMs: 5000,
			};

			@HealthAttestor(options)
			class DatabaseAttestor implements HealthAttestorContract {
				public check(): HealthCheckOutcome {
					return { status: "ok" };
				}
			}

			const read = Reflect.getMetadata(
				METADATA_KEY_HEALTH_ATTESTOR,
				DatabaseAttestor,
			) as HealthAttestorOptions | undefined;

			expect(read).toEqual(options);
		});

		it("applies @Injectable() so consumers do not have to", () => {
			@HealthAttestor({ name: "x" })
			class X implements HealthAttestorContract {
				public check(): HealthCheckOutcome {
					return { status: "ok" };
				}
			}

			// `@Injectable()` defines both INJECTABLE_WATERMARK and
			// SCOPE_OPTIONS_METADATA on the target. The watermark uses the
			// literal key `"__injectable__"` internally.
			expect(Reflect.getMetadata("__injectable__", X)).toBe(true);
		});

		it("allows the interface and decorator to share the name HealthAttestor", () => {
			// This test compiles iff HealthAttestor is usable in both value
			// and type positions in the same scope.
			@HealthAttestor({ name: "shared" })
			class Shared implements HealthAttestorContract {
				public check(): HealthCheckOutcome {
					return { status: "ok" };
				}
			}

			expect(new Shared().check()).toEqual({ status: "ok" });
		});
	});
});
