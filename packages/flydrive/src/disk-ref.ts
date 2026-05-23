import type { Disk } from "flydrive";

/**
 * Constructor type for disk reference classes produced by `defineDisk()`.
 *
 * The instance type is `Disk` so that injected fields typed by a ref class
 * (e.g. `private readonly uploads: UploadsDisk`) expose the full `Disk`
 * API directly. The constructor signature is `abstract`, so attempting
 * `new UploadsDisk()` fails at compile time.
 */
export type DiskRefClass = abstract new () => Disk;

/**
 * Creates an abstract class to serve as a disk reference token.
 *
 * Typical usage:
 *
 * ```ts
 * import { defineDisk } from "@abinnovision/nestjs-flydrive";
 *
 * export class UploadsDisk extends defineDisk() {}
 * export class BackupsDisk extends defineDisk() {}
 * ```
 *
 * The returned class is used in three ways:
 *
 * 1. As the DI token passed in `FlydriveModule.forRoot({ disks: [...] })`.
 * 2. As the type at injection sites; the field resolves to `Disk`, so
 *    methods like `put`, `get`, `getSignedUrl` are available directly.
 * 3. As the identity the module uses to look up the driver. Equality is
 *    by constructor reference, never by name, so minification is safe.
 *
 * Calling `new UploadsDisk()` is a compile-time error. The runtime
 * constructor throws as a fallback if a caller bypasses the type system.
 */
export function defineDisk(): DiskRefClass {
	// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- This class exists only as a unique DI token identity; instance shape is unused.
	class DiskRef {
		public constructor() {
			throw new Error(
				"Classes returned by `defineDisk()` are DI tokens and cannot be instantiated. " +
					"Inject the class instead of calling `new` on it.",
			);
		}
	}

	return DiskRef as unknown as DiskRefClass;
}
