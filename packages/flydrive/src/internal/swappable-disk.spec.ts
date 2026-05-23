import { Disk } from "flydrive";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SwappableDisk } from "./swappable-disk.js";

import type { DriverContract } from "flydrive/types";

/**
 * Minimal stub driver that records calls so we can verify which underlying
 * driver actually serviced a Disk method.
 */
function makeDriver(label: string): DriverContract & { label: string } {
	const exists = vi.fn().mockResolvedValue(false);

	return {
		label,
		exists,
		put: vi.fn().mockResolvedValue(undefined),
		putStream: vi.fn().mockResolvedValue(undefined),
		get: vi.fn().mockResolvedValue(""),
		getStream: vi.fn(),
		getBytes: vi.fn().mockResolvedValue(new Uint8Array()),
		delete: vi.fn().mockResolvedValue(undefined),
		deleteAll: vi.fn().mockResolvedValue(undefined),
		copy: vi.fn().mockResolvedValue(undefined),
		move: vi.fn().mockResolvedValue(undefined),
		getMetaData: vi.fn().mockResolvedValue({}),
		listAll: vi.fn().mockResolvedValue({ objects: [], directories: [] }),
		getVisibility: vi.fn().mockResolvedValue("private"),
		setVisibility: vi.fn().mockResolvedValue(undefined),
		getUrl: vi.fn().mockResolvedValue(""),
		getSignedUrl: vi.fn().mockResolvedValue(""),
		getSignedUploadUrl: vi.fn().mockResolvedValue(""),
	} as unknown as DriverContract & { label: string };
}

describe("swappableDisk", () => {
	let originalDriver: ReturnType<typeof makeDriver>;
	let swappable: SwappableDisk;

	beforeEach(() => {
		originalDriver = makeDriver("original");
		swappable = new SwappableDisk(originalDriver);
	});

	it("exposes a Proxy that passes `instanceof Disk`", () => {
		expect(swappable.disk).toBeInstanceOf(Disk);
	});

	it("forwards method calls to the original driver until swapped", async () => {
		await swappable.disk.exists("a.txt");

		expect(originalDriver.exists).toHaveBeenCalledWith("a.txt");
	});

	it("routes calls to the swapped driver after `swap()`", async () => {
		const replacement = makeDriver("replacement");

		swappable.swap(replacement);
		await swappable.disk.exists("b.txt");

		expect(replacement.exists).toHaveBeenCalledWith("b.txt");
		expect(originalDriver.exists).not.toHaveBeenCalled();
	});

	it("keeps the same proxy reference across swaps", () => {
		const before = swappable.disk;
		swappable.swap(makeDriver("two"));
		const after = swappable.disk;

		expect(before).toBe(after);
	});

	it("restores the original driver after `restore()`", async () => {
		const replacement = makeDriver("replacement");
		swappable.swap(replacement);

		swappable.restore();
		await swappable.disk.exists("c.txt");

		expect(originalDriver.exists).toHaveBeenCalledWith("c.txt");
	});
});
