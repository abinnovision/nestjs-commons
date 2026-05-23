import { Inject, Injectable } from "@nestjs/common";

import { flydriveModuleConfigToken } from "./flydrive.module-config.js";
import { SwappableDisk } from "./internal/swappable-disk.js";

import type { DiskRefClass } from "./disk-ref.js";
import type { ResolvedFlydriveConfig } from "./flydrive.module-config.js";
import type { OnModuleInit } from "@nestjs/common";
import type { Disk } from "flydrive";
import type { DriverContract } from "flydrive/types";

/**
 * Owns the `Disk` instances behind every registered ref class.
 *
 * Every driver is constructed during `onModuleInit` so misconfiguration
 * surfaces at application startup. Construction happens at most once per
 * ref; subsequent `resolve()` calls return the cached instance.
 *
 * Each `Disk` is wrapped in a {@link SwappableDisk} so the fakes API can
 * swap the driver at runtime without invalidating already-injected
 * references.
 */
@Injectable()
export class DiskRegistry implements OnModuleInit {
	private readonly disks = new Map<DiskRefClass, SwappableDisk>();

	public constructor(
		@Inject(flydriveModuleConfigToken)
		private readonly config: ResolvedFlydriveConfig,
	) {}

	public onModuleInit(): void {
		for (const entry of this.config.disks) {
			this.ensure(entry.ref);
		}
	}

	/**
	 * Resolve the `Disk` instance associated with a ref class.
	 *
	 * Throws if the ref is not registered with the module.
	 */
	public resolve(ref: DiskRefClass): Disk {
		return this.ensure(ref).disk;
	}

	/**
	 * Replace the driver behind a ref. Used by {@link FlydriveTester.fake}.
	 */
	public swap(ref: DiskRefClass, driver: DriverContract): void {
		this.ensure(ref).swap(driver);
	}

	/**
	 * Restore the original driver for a ref.
	 */
	public restore(ref: DiskRefClass): void {
		this.ensure(ref).restore();
	}

	private ensure(ref: DiskRefClass): SwappableDisk {
		const existing = this.disks.get(ref);

		if (existing !== undefined) {
			return existing;
		}

		const entry = this.config.disks.find((d) => d.ref === ref);

		if (entry === undefined) {
			throw new Error(
				"FlydriveModule: requested disk reference is not registered. " +
					"Ensure the ref class is listed in `FlydriveModule.forRoot({ disks })`.",
			);
		}

		const swappable = new SwappableDisk(entry.driver());

		this.disks.set(ref, swappable);

		return swappable;
	}
}
