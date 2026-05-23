import { Test } from "@nestjs/testing";
import { Disk } from "flydrive";
import { describe, expect, it, vi } from "vitest";

import { DefaultDisk } from "./default-disk.js";
import { defineDisk } from "./disk-ref.js";
import { FlydriveTester } from "./flydrive-tester.js";
import { FlydriveModule } from "./flydrive.module.js";

import type { DriverContract } from "flydrive/types";

class UploadsDisk extends defineDisk() {}
class BackupsDisk extends defineDisk() {}
class ReportsDisk extends defineDisk() {}

function makeDriver(label: string): DriverContract & { label: string } {
	return {
		label,
		exists: vi.fn().mockResolvedValue(false),
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

describe("flydriveModule.forRoot", () => {
	it("resolves each registered disk class to a working Disk", async () => {
		const uploadsDriver = makeDriver("uploads");
		const backupsDriver = makeDriver("backups");

		const moduleRef = await Test.createTestingModule({
			imports: [
				FlydriveModule.forRoot({
					default: UploadsDisk,
					disks: [
						{ ref: UploadsDisk, driver: () => uploadsDriver },
						{ ref: BackupsDisk, driver: () => backupsDriver },
					],
				}),
			],
		}).compile();

		await moduleRef.init();

		const uploads = moduleRef.get(UploadsDisk);
		const backups = moduleRef.get(BackupsDisk);

		expect(uploads).toBeInstanceOf(Disk);
		expect(backups).toBeInstanceOf(Disk);
		expect(uploads).not.toBe(backups);

		await moduleRef.close();
	});

	it("aliases DefaultDisk to the configured default ref", async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [
				FlydriveModule.forRoot({
					default: UploadsDisk,
					disks: [
						{ ref: UploadsDisk, driver: () => makeDriver("uploads") },
						{ ref: BackupsDisk, driver: () => makeDriver("backups") },
					],
				}),
			],
		}).compile();

		await moduleRef.init();

		const fromDefault = moduleRef.get(DefaultDisk);
		const fromRef = moduleRef.get(UploadsDisk);

		expect(fromDefault).toBe(fromRef);

		await moduleRef.close();
	});

	it("constructs every driver eagerly during onModuleInit by default", async () => {
		const uploadsFactory = vi.fn(() => makeDriver("uploads"));
		const backupsFactory = vi.fn(() => makeDriver("backups"));

		const moduleRef = await Test.createTestingModule({
			imports: [
				FlydriveModule.forRoot({
					default: UploadsDisk,
					disks: [
						{ ref: UploadsDisk, driver: uploadsFactory },
						{ ref: BackupsDisk, driver: backupsFactory },
					],
				}),
			],
		}).compile();

		await moduleRef.init();

		expect(uploadsFactory).toHaveBeenCalledTimes(1);
		expect(backupsFactory).toHaveBeenCalledTimes(1);

		await moduleRef.close();
	});

	it("invokes each driver factory exactly once even when injected", async () => {
		const uploadsFactory = vi.fn(() => makeDriver("uploads"));
		const backupsFactory = vi.fn(() => makeDriver("backups"));

		const moduleRef = await Test.createTestingModule({
			imports: [
				FlydriveModule.forRoot({
					default: UploadsDisk,
					disks: [
						{ ref: UploadsDisk, driver: uploadsFactory },
						{ ref: BackupsDisk, driver: backupsFactory },
					],
				}),
			],
		}).compile();

		await moduleRef.init();

		moduleRef.get(UploadsDisk);
		moduleRef.get(BackupsDisk);

		expect(uploadsFactory).toHaveBeenCalledTimes(1);
		expect(backupsFactory).toHaveBeenCalledTimes(1);

		await moduleRef.close();
	});

	it("throws synchronously when default is not in disks", () => {
		expect(() =>
			FlydriveModule.forRoot({
				default: ReportsDisk,
				disks: [{ ref: UploadsDisk, driver: () => makeDriver("uploads") }],
			}),
		).toThrow(/`default`.*must be one of the registered/i);
	});

	it("throws synchronously when a ref is registered twice", () => {
		expect(() =>
			FlydriveModule.forRoot({
				default: UploadsDisk,
				disks: [
					{ ref: UploadsDisk, driver: () => makeDriver("a") },
					{ ref: UploadsDisk, driver: () => makeDriver("b") },
				],
			}),
		).toThrow(/duplicate/i);
	});
});

describe("flydriveModule.forRootAsync", () => {
	it("resolves disks from an async factory", async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [
				FlydriveModule.forRootAsync({
					default: UploadsDisk,
					disks: [UploadsDisk, BackupsDisk],
					useFactory: () =>
						Promise.resolve({
							drivers: [
								{ ref: UploadsDisk, driver: () => makeDriver("uploads") },
								{ ref: BackupsDisk, driver: () => makeDriver("backups") },
							],
						}),
				}),
			],
		}).compile();

		await moduleRef.init();

		const uploads = moduleRef.get(UploadsDisk);
		const backups = moduleRef.get(BackupsDisk);
		const defaultDisk = moduleRef.get(DefaultDisk);

		expect(uploads).toBeInstanceOf(Disk);
		expect(backups).toBeInstanceOf(Disk);
		expect(defaultDisk).toBe(uploads);

		await moduleRef.close();
	});

	it("throws at compile time of the testing module when driver set does not match declared disks", async () => {
		const compile = Test.createTestingModule({
			imports: [
				FlydriveModule.forRootAsync({
					default: UploadsDisk,
					disks: [UploadsDisk, BackupsDisk],
					useFactory: () => ({
						drivers: [
							{ ref: UploadsDisk, driver: () => makeDriver("uploads") },
							// BackupsDisk missing
						],
					}),
				}),
			],
		}).compile();

		await expect(compile).rejects.toThrow(/missing driver/i);
	});
});

describe("flydriveTester", () => {
	it("swaps the driver behind a ref and restores it", async () => {
		const original = makeDriver("original");
		const replacement = makeDriver("replacement");

		const moduleRef = await Test.createTestingModule({
			imports: [
				FlydriveModule.forRoot({
					default: UploadsDisk,
					disks: [{ ref: UploadsDisk, driver: () => original }],
				}),
			],
		}).compile();

		await moduleRef.init();

		const disk = moduleRef.get(UploadsDisk);
		const tester = moduleRef.get(FlydriveTester);

		await disk.exists("a.txt");
		expect(original.exists).toHaveBeenCalledWith("a.txt");

		tester.fake(UploadsDisk, replacement);
		await disk.exists("b.txt");
		expect(replacement.exists).toHaveBeenCalledWith("b.txt");

		tester.restore(UploadsDisk);
		await disk.exists("c.txt");
		expect(original.exists).toHaveBeenCalledWith("c.txt");

		await moduleRef.close();
	});

	it("accepts a factory for the replacement driver", async () => {
		const original = makeDriver("original");
		const replacement = makeDriver("replacement");

		const moduleRef = await Test.createTestingModule({
			imports: [
				FlydriveModule.forRoot({
					default: UploadsDisk,
					disks: [{ ref: UploadsDisk, driver: () => original }],
				}),
			],
		}).compile();

		await moduleRef.init();

		const disk = moduleRef.get(UploadsDisk);
		const tester = moduleRef.get(FlydriveTester);

		tester.fake(UploadsDisk, () => replacement);
		await disk.exists("d.txt");
		expect(replacement.exists).toHaveBeenCalledWith("d.txt");

		await moduleRef.close();
	});
});
