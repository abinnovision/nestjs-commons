import { describe, expect, it } from "vitest";

import { defineDisk } from "../disk-ref.js";
import {
	assertDefaultInDisks,
	assertDriversMatchDisks,
	assertNoDuplicateRefs,
} from "./validation.js";

import type { DiskRefClass } from "../disk-ref.js";
import type { FlydriveDiskEntry } from "../flydrive.module-config.js";

class Uploads extends defineDisk() {}
class Backups extends defineDisk() {}
class Reports extends defineDisk() {}

function entry(ref: DiskRefClass): FlydriveDiskEntry<readonly DiskRefClass[]> {
	return {
		ref,
		driver: () => {
			throw new Error("driver factory not expected to run in this test");
		},
	};
}

describe("assertNoDuplicateRefs()", () => {
	it("does not throw when every ref is unique", () => {
		expect(() => {
			assertNoDuplicateRefs([Uploads, Backups, Reports]);
		}).not.toThrow();
	});

	it("throws when a ref appears more than once", () => {
		expect(() => {
			assertNoDuplicateRefs([Uploads, Backups, Uploads]);
		}).toThrow(/duplicate/i);
	});
});

describe("assertDefaultInDisks()", () => {
	it("does not throw when the default ref is present", () => {
		expect(() => {
			assertDefaultInDisks(Uploads, [Uploads, Backups]);
		}).not.toThrow();
	});

	it("throws when the default ref is missing from the list", () => {
		expect(() => {
			assertDefaultInDisks(Reports, [Uploads, Backups]);
		}).toThrow(/`default`.*must be one of the registered/i);
	});
});

describe("assertDriversMatchDisks()", () => {
	it("does not throw when declared and returned sets match exactly", () => {
		expect(() => {
			assertDriversMatchDisks(
				[Uploads, Backups],
				[entry(Uploads), entry(Backups)],
			);
		}).not.toThrow();
	});

	it("throws when a declared ref has no matching driver", () => {
		expect(() => {
			assertDriversMatchDisks([Uploads, Backups], [entry(Uploads)]);
		}).toThrow(/missing driver/i);
	});

	it("throws when the factory returns a driver for an unexpected ref", () => {
		expect(() => {
			assertDriversMatchDisks([Uploads], [entry(Uploads), entry(Backups)]);
		}).toThrow(/unexpected driver/i);
	});

	it("reports missing and unexpected refs together", () => {
		expect(() => {
			assertDriversMatchDisks([Uploads, Backups], [entry(Reports)]);
		}).toThrow(/missing driver.*unexpected driver/is);
	});
});
