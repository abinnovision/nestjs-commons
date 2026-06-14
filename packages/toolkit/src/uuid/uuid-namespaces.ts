import { v5 } from "uuid";

import { toUUID } from "./to-uuid.js";

/**
 * The DNS namespace UUID for use with v5 deterministic generation.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc4122#appendix-C RFC 4122 Appendix C}
 */
export const UUID_NAMESPACE_DNS = toUUID(v5.DNS);

/**
 * The URL namespace UUID for use with v5 deterministic generation.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc4122#appendix-C RFC 4122 Appendix C}
 */
export const UUID_NAMESPACE_URL = toUUID(v5.URL);

/**
 * The ISO OID namespace UUID for use with v5 deterministic generation.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc4122#appendix-C RFC 4122 Appendix C}
 */
export const UUID_NAMESPACE_OID = toUUID(
	"6ba7b812-9dad-11d1-80b4-00c04fd430c8",
);

/**
 * The X.500 DN namespace UUID for use with v5 deterministic generation.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc4122#appendix-C RFC 4122 Appendix C}
 */
export const UUID_NAMESPACE_X500 = toUUID(
	"6ba7b814-9dad-11d1-80b4-00c04fd430c8",
);
