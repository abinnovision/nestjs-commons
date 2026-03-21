import { Logger } from "@nestjs/common";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockDeep } from "vitest-mock-extended";

import { WorkerManagementService } from "./worker-management.service.js";
import { TestTask, TestWorkflow } from "../__fixtures__/test-hosts.js";
import { HatchetFeatureRegistration } from "../internal/registrations.js";

import type { HatchetModuleConfig } from "../hatchet.module-config.js";
import type { DeclarationBuilderService } from "./declaration-builder.service.js";
import type { HatchetClient } from "@hatchet-dev/typescript-sdk";
import type { ModuleRef } from "@nestjs/core";

/**
 * Helper: creates a WorkerManagementService with controlled mocks.
 * Tests call the private `detectOrphanWorkflows` directly (awaited) to avoid
 * fire-and-forget race conditions between tests.
 */
const createService = (opts: {
	config: HatchetModuleConfig;
	registrations?: HatchetFeatureRegistration[];
	serverWorkflows?: Array<{ name: string }>;
	serverWorkflowPages?: Array<Array<{ name: string }>>;
	listShouldReject?: boolean;
}) => {
	const mockClient = mockDeep<HatchetClient>();
	const mockModuleRef = mockDeep<ModuleRef>();
	const mockDeclarationBuilder = mockDeep<DeclarationBuilderService>();

	const registrations = opts.registrations ?? [];

	// discoverFeatureRegistrations calls moduleRef.get once per invocation.
	mockModuleRef.get.mockReturnValue(registrations as any);

	// Mock workflows.list
	if (opts.listShouldReject) {
		mockClient.workflows.list.mockRejectedValue(new Error("API error"));
	} else if (opts.serverWorkflowPages) {
		for (const page of opts.serverWorkflowPages) {
			const response = { rows: page };

			mockClient.workflows.list.mockResolvedValueOnce(response as any);
		}
	} else {
		const response = { rows: opts.serverWorkflows ?? [] };

		mockClient.workflows.list.mockResolvedValue(response as any);
	}

	const service = new WorkerManagementService(
		mockClient as any,
		mockDeclarationBuilder as any,
		opts.config,
		mockModuleRef as any,
	);

	return { service, mockClient, mockModuleRef };
};

/** Invoke the private detectOrphanWorkflows and await it. */
async function detectOrphans(service: WorkerManagementService): Promise<void> {
	await (service as any).detectOrphanWorkflows();
}

const workerConfig: HatchetModuleConfig = {
	config: {},
	worker: { name: "test-worker" },
};

const noWorkerConfig: HatchetModuleConfig = {
	config: {},
	worker: undefined,
};

describe("worker-management.service.ts", () => {
	let warnSpy: ReturnType<typeof vi.spyOn>;
	let debugSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		warnSpy = vi.spyOn(Logger.prototype, "warn").mockImplementation(() => {});
		debugSpy = vi.spyOn(Logger.prototype, "debug").mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("detectOrphanWorkflows", () => {
		it("warns about orphan workflows", async () => {
			const { service } = createService({
				config: workerConfig,
				registrations: [
					new HatchetFeatureRegistration([TestTask, TestWorkflow]),
				],
				serverWorkflows: [
					{ name: "test-task" },
					{ name: "test-workflow" },
					{ name: "orphan-task" },
				],
			});

			await detectOrphans(service);

			expect(warnSpy).toHaveBeenCalledWith(
				expect.stringContaining("orphan-task"),
			);
			expect(warnSpy).toHaveBeenCalledWith(
				expect.stringContaining("1 orphan workflow(s)"),
			);
		});

		it("does not warn when no orphans exist", async () => {
			const { service } = createService({
				config: workerConfig,
				registrations: [
					new HatchetFeatureRegistration([TestTask, TestWorkflow]),
				],
				serverWorkflows: [{ name: "test-task" }, { name: "test-workflow" }],
			});

			await detectOrphans(service);

			expect(warnSpy).not.toHaveBeenCalledWith(
				expect.stringContaining("orphan"),
			);
		});

		it("handles empty server response", async () => {
			const { service } = createService({
				config: workerConfig,
				registrations: [new HatchetFeatureRegistration([TestTask])],
				serverWorkflows: [],
			});

			await detectOrphans(service);

			expect(warnSpy).not.toHaveBeenCalledWith(
				expect.stringContaining("orphan"),
			);
		});

		it("skips API call when no local registrations exist", async () => {
			const { service, mockClient } = createService({
				config: workerConfig,
				registrations: [],
			});

			await detectOrphans(service);

			expect(mockClient.workflows.list).not.toHaveBeenCalled();
		});

		it("skips when worker config is undefined", async () => {
			const { service, mockClient } = createService({
				config: noWorkerConfig,
			});

			await detectOrphans(service);

			expect(mockClient.workflows.list).not.toHaveBeenCalled();
		});

		it("does not throw when API call fails", async () => {
			const { service } = createService({
				config: workerConfig,
				registrations: [new HatchetFeatureRegistration([TestTask])],
				listShouldReject: true,
			});

			await detectOrphans(service);

			expect(debugSpy).toHaveBeenCalledWith(
				expect.stringContaining("Orphan workflow detection failed; skipping."),
			);
		});

		it("handles paginated results", async () => {
			// Create two pages: first full (50 items), second partial (1 item = orphan).
			const page1 = Array.from({ length: 50 }, (_, i) => ({
				name: `server-wf-${String(i)}`,
			}));
			const page2 = [{ name: "orphan-on-page-2" }];

			const { service, mockClient } = createService({
				config: workerConfig,
				registrations: [new HatchetFeatureRegistration([TestTask])],
				serverWorkflowPages: [page1, page2],
			});

			await detectOrphans(service);

			// Should have made 2 API calls (page 1 was full, page 2 was partial).
			expect(mockClient.workflows.list).toHaveBeenCalledTimes(2);
			expect(mockClient.workflows.list).toHaveBeenCalledWith({
				offset: 0,
				limit: 50,
			});
			expect(mockClient.workflows.list).toHaveBeenCalledWith({
				offset: 50,
				limit: 50,
			});

			// The orphan from page 2 should be reported.
			expect(warnSpy).toHaveBeenCalledWith(
				expect.stringContaining("orphan-on-page-2"),
			);
		});
	});
});
