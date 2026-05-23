import { DiskRegistry } from "../disk-registry.js";

import type { DiskRefClass } from "../disk-ref.js";
import type { Provider } from "@nestjs/common";

/**
 * Build one provider per registered ref class.
 *
 * Each provider resolves the disk via the {@link DiskRegistry}, which owns
 * memoisation and the swappable-driver wrapper used by the fakes API.
 */
export function buildPerDiskProviders(
	refs: readonly DiskRefClass[],
): Provider[] {
	return refs.map(
		(ref): Provider => ({
			provide: ref,
			useFactory: (registry: DiskRegistry) => registry.resolve(ref),
			inject: [DiskRegistry],
		}),
	);
}
