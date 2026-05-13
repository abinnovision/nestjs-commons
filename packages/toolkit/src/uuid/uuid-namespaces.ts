import { v5 } from "uuid";

import type { UUID } from "./uuid.types";

/**
 * The DNS namespace UUID for use with v5 deterministic generation.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc4122#appendix-C RFC 4122 Appendix C}
 */
export const UUID_NAMESPACE_DNS = v5.DNS as UUID;

/**
 * The URL namespace UUID for use with v5 deterministic generation.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc4122#appendix-C RFC 4122 Appendix C}
 */
export const UUID_NAMESPACE_URL = v5.URL as UUID;

/**
 * The ISO OID namespace UUID for use with v5 deterministic generation.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc4122#appendix-C RFC 4122 Appendix C}
 */
export const UUID_NAMESPACE_OID =
	"6ba7b812-9dad-11d1-80b4-00c04fd430c8" as UUID;

/**
 * The X.500 DN namespace UUID for use with v5 deterministic generation.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc4122#appendix-C RFC 4122 Appendix C}
 */
export const UUID_NAMESPACE_X500 =
	"6ba7b814-9dad-11d1-80b4-00c04fd430c8" as UUID;
