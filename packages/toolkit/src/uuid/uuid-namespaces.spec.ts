import { describe, expect, it } from "vitest";

import { isUUID } from "./is-uuid";
import {
	UUID_NAMESPACE_DNS,
	UUID_NAMESPACE_OID,
	UUID_NAMESPACE_URL,
	UUID_NAMESPACE_X500,
} from "./uuid-namespaces";

describe("uuid/uuid-namespaces.ts", () => {
	it("uUID_NAMESPACE_DNS is a valid UUID", () => {
		expect(isUUID(UUID_NAMESPACE_DNS)).toBe(true);
	});

	it("uUID_NAMESPACE_DNS matches the RFC 4122 value", () => {
		expect(UUID_NAMESPACE_DNS).toBe("6ba7b810-9dad-11d1-80b4-00c04fd430c8");
	});

	it("uUID_NAMESPACE_URL is a valid UUID", () => {
		expect(isUUID(UUID_NAMESPACE_URL)).toBe(true);
	});

	it("uUID_NAMESPACE_URL matches the RFC 4122 value", () => {
		expect(UUID_NAMESPACE_URL).toBe("6ba7b811-9dad-11d1-80b4-00c04fd430c8");
	});

	it("uUID_NAMESPACE_OID is a valid UUID", () => {
		expect(isUUID(UUID_NAMESPACE_OID)).toBe(true);
	});

	it("uUID_NAMESPACE_OID matches the RFC 4122 value", () => {
		expect(UUID_NAMESPACE_OID).toBe("6ba7b812-9dad-11d1-80b4-00c04fd430c8");
	});

	it("uUID_NAMESPACE_X500 is a valid UUID", () => {
		expect(isUUID(UUID_NAMESPACE_X500)).toBe(true);
	});

	it("uUID_NAMESPACE_X500 matches the RFC 4122 value", () => {
		expect(UUID_NAMESPACE_X500).toBe("6ba7b814-9dad-11d1-80b4-00c04fd430c8");
	});
});
