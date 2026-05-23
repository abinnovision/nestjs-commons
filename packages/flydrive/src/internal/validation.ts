import type { DiskRefClass } from "../disk-ref.js";
import type { FlydriveDiskEntry } from "../flydrive.module-config.js";

function refLabel(ref: DiskRefClass): string {
	const name = (ref as { name?: string }).name;

	return name && name.length > 0 ? name : "<anonymous disk ref>";
}

/**
 * Throws if any ref appears more than once in the declared list.
 */
export function assertNoDuplicateRefs(disks: readonly DiskRefClass[]): void {
	const seen = new Set<DiskRefClass>();

	for (const ref of disks) {
		if (seen.has(ref)) {
			throw new Error(
				`FlydriveModule: duplicate disk reference (${refLabel(ref)}) in \`disks\`.`,
			);
		}

		seen.add(ref);
	}
}

/**
 * Throws if `defaultRef` is not present in the declared list.
 */
export function assertDefaultInDisks(
	defaultRef: DiskRefClass,
	disks: readonly DiskRefClass[],
): void {
	if (disks.includes(defaultRef)) {
		return;
	}

	throw new Error(
		`FlydriveModule: \`default\` (${refLabel(defaultRef)}) must be one of the registered \`disks\`.`,
	);
}

/**
 * Throws unless the set of refs declared in `forRootAsync({ disks })`
 * matches the set of refs returned by the user's `useFactory`. Both a
 * missing ref and an unexpected ref are errors.
 */
export function assertDriversMatchDisks(
	declared: readonly DiskRefClass[],
	returned: ReadonlyArray<FlydriveDiskEntry<readonly DiskRefClass[]>>,
): void {
	const declaredSet = new Set(declared);
	const returnedRefs = returned.map((entry) => entry.ref);
	const returnedSet = new Set(returnedRefs);

	const missing = declared.filter((ref) => !returnedSet.has(ref));
	const extras = returnedRefs.filter((ref) => !declaredSet.has(ref));

	if (missing.length === 0 && extras.length === 0) {
		return;
	}

	const parts: string[] = [];

	if (missing.length > 0) {
		parts.push(`missing driver for: ${missing.map(refLabel).join(", ")}`);
	}

	if (extras.length > 0) {
		parts.push(`unexpected driver for: ${extras.map(refLabel).join(", ")}`);
	}

	throw new Error(
		`FlydriveModule.forRootAsync: driver factories do not match the declared \`disks\` (${parts.join("; ")}).`,
	);
}
