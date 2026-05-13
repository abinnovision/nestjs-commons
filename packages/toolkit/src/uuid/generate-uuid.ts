import { v4, v5, v7 } from "uuid";

import type { UUID } from "./uuid.types";

/**
 * Options for generating a v5 deterministic UUID.
 *
 * Requires a namespace (use one of the `UUID_NAMESPACE_*` constants or any
 * valid {@link UUID}) and a name string. The same namespace + name pair
 * always produces the same UUID.
 */
export interface GenerateUUIDV5Opts {
	version: 5;
	namespace: UUID;
	name: string;
}

/**
 * Options for generating a v7 sortable UUID.
 *
 * v7 UUIDs embed a Unix millisecond timestamp, making them
 * lexicographically sortable — useful for database primary keys.
 */
export interface GenerateUUIDV7Opts {
	version: 7;
}

/**
 * Generate a random v4 UUID.
 *
 * @returns A new random {@link UUID}
 */
export function generateUUID(): UUID;

/**
 * Generate a deterministic v5 UUID from a namespace and name.
 *
 * The same `namespace` + `name` pair always produces the same UUID,
 * making this suitable for stable IDs derived from known inputs.
 *
 * @param opts - Options with `version: 5`, a `namespace` UUID, and a `name` string
 * @returns A deterministic {@link UUID}
 */
// eslint-disable-next-line @typescript-eslint/unified-signatures
export function generateUUID(opts: GenerateUUIDV5Opts): UUID;

/**
 * Generate a sortable v7 UUID.
 *
 * v7 UUIDs embed a Unix millisecond timestamp and are lexicographically
 * sortable, making them well-suited for use as database primary keys.
 *
 * @param opts - Options with `version: 7`
 * @returns A new sortable {@link UUID}
 */
// eslint-disable-next-line @typescript-eslint/unified-signatures
export function generateUUID(opts: GenerateUUIDV7Opts): UUID;

export function generateUUID(
	opts?: GenerateUUIDV5Opts | GenerateUUIDV7Opts,
): UUID {
	if (!opts) {
		return v4() as UUID;
	}

	if (opts.version === 5) {
		return v5(opts.name, opts.namespace) as UUID;
	}

	return v7() as UUID;
}
