import { Disk } from "flydrive";

import type { DriverContract } from "flydrive/types";

/**
 * Wraps a `Disk` so its underlying driver can be replaced at runtime
 * without invalidating already-injected references.
 *
 * The `disk` field is a Proxy whose target is a real `Disk`, so the
 * prototype chain (and therefore `instanceof Disk`) is preserved.
 * Property reads route through the current inner disk. Swapping the
 * driver replaces the inner disk; consumers holding a reference to
 * `disk` see the new driver on the next call without refetching.
 */
export class SwappableDisk {
	public readonly disk: Disk;
	private readonly originalDriver: DriverContract;
	private currentDisk: Disk;

	public constructor(driver: DriverContract) {
		this.originalDriver = driver;
		this.currentDisk = new Disk(driver);

		this.disk = new Proxy(this.currentDisk, {
			get: (_target, prop): unknown => {
				const value: unknown = Reflect.get(
					this.currentDisk,
					prop,
					this.currentDisk,
				);

				return typeof value === "function"
					? value.bind(this.currentDisk)
					: value;
			},
			getPrototypeOf: () => Disk.prototype,
		});
	}

	public swap(driver: DriverContract): void {
		this.currentDisk = new Disk(driver);
	}

	public restore(): void {
		this.currentDisk = new Disk(this.originalDriver);
	}
}
