import { BaseCtx, ExecutionWrapper } from "@abinnovision/nestjs-hatchet";
import { Injectable, Logger } from "@nestjs/common";

/**
 * Example ExecutionWrapper that logs task execution with timing.
 * Demonstrates how to wrap all task/workflow executions with cross-cutting concerns.
 */
@Injectable()
export class LoggingExecutionWrapper extends ExecutionWrapper {
	private readonly logger = new Logger("HatchetTask");

	public async wrap<T>(ctx: BaseCtx<any>, next: () => Promise<T>): Promise<T> {
		const taskName = ctx.fromSDK.taskName();
		const workflowRunId = ctx.fromSDK.workflowRunId();
		const startTime = Date.now();

		this.logger.log(`[${workflowRunId}] Starting task: ${taskName}`);
		this.logger.debug(`[${workflowRunId}] Input: ${JSON.stringify(ctx.input)}`);

		try {
			const result = await next();
			const duration = Date.now() - startTime;
			this.logger.log(
				`[${workflowRunId}] Completed task: ${taskName} (${String(duration)}ms)`,
			);
			return result;
		} catch (error) {
			const duration = Date.now() - startTime;
			this.logger.error(
				`[${workflowRunId}] Failed task: ${taskName} (${String(duration)}ms)`,
				error,
			);
			throw error;
		}
	}
}
