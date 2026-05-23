import { Injectable } from "@nestjs/common";

import { DiskRegistry } from "./disk-registry.js";

import type { DiskRefClass } from "./disk-ref.js";
import type { DriverContract } from "flydrive/types";

/**
 * Test helper for swapping a disk's driver at runtime.
 *
 * Intended for integration / E2E tests where you want to replace one disk
 * (e.g. an S3 disk pointing at AWS) with a local-filesystem-backed driver
 * without rebuilding the testing module:
 *
 * ```ts
 * const tester = app.get(FlydriveTester);
 *
 * tester.fake(UploadsDisk, new FSDriver({
 *   location: new URL("./tmp", import.meta.url),
 *   visibility: "public",
 * }));
 *
 * // ... assertions ...
 *
 * tester.restore(UploadsDisk);
 * ```
 *
 * Standard `overrideProvider(UploadsDisk).useValue(...)` continues to work
 * for tests that prefer compile-time overrides.
 */
@Injectable()
export class FlydriveTester {
	public constructor(private readonly registry: DiskRegistry) {}

	/**
	 * Swap the driver behind a disk reference. The injected `Disk` value
	 * keeps its object identity; only its internal driver changes, so
	 * already-resolved consumers transparently see the new behaviour.
	 *
	 * `driver` accepts either a ready-built `DriverContract` instance or a
	 * factory function. The factory form is useful when driver construction
	 * should be deferred inside a test setup hook.
	 */
	public fake(
		ref: DiskRefClass,
		driver: DriverContract | (() => DriverContract),
	): void {
		const resolved = typeof driver === "function" ? driver() : driver;

		this.registry.swap(ref, resolved);
	}

	/**
	 * Restore the disk's original driver, undoing a prior `fake()` call.
	 */
	public restore(ref: DiskRefClass): void {
		this.registry.restore(ref);
	}
}
