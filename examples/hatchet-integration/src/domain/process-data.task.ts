import {
	HelperCtx,
	Host,
	Task,
	TaskCtx,
	taskHost,
	taskRef,
	WorkflowCtx,
	workflowHost,
	WorkflowTask,
} from "@abinnovision/nestjs-hatchet";
import { z } from "zod";

@Host({ name: "process-data" })
export class ProcessDataTask extends taskHost(z.object({ data: z.string() })) {
	@Task({})
	public task(ctx: TaskCtx<typeof this>) {
		console.log("Access to task input", ctx.input.data);

		const helperResult = this.helper(ctx);

		console.log("Access to helper result", helperResult.result);

		return {
			result: helperResult.result,
		};
	}

	private helper(ctx: HelperCtx<typeof this>) {
		return {
			result: ctx.input.data,
		};
	}
}

@Host({
	name: "process-data-workflow",
})
export class ProcessDataWorkflow extends workflowHost(
	z.object({ data: z.string() }),
) {
	@WorkflowTask<typeof ProcessDataWorkflow>({ parents: [] })
	public cleanUpData(ctx: WorkflowCtx<typeof this>) {
		console.log("Access to workflow input", ctx.input);

		return {
			output: ctx.input.data,
		};
	}

	@WorkflowTask<typeof ProcessDataWorkflow>({ parents: ["cleanUpData"] })
	public async processData(ctx: WorkflowCtx<typeof this>) {
		console.log("Access to workflow input", ctx.input.data);

		// eslint-disable-next-line @typescript-eslint/unbound-method
		const result = await ctx.parent(this.cleanUpData);

		const runResult = await ctx.run(
			taskRef(ProcessDataTask),
			{ data: result.output },
			{ wait: false },
		);

		console.log("Access to task output", (await runResult.output).result);

		return {
			processResult: result.output,
		};
	}

	@WorkflowTask<typeof ProcessDataWorkflow>({
		parents: ["processData"],
	})
	public async transformOutputData(ctx: WorkflowCtx<typeof this>) {
		// eslint-disable-next-line @typescript-eslint/unbound-method
		const parent = await ctx.parent(this.processData);

		return {
			resultData: parent.processResult,
		};
	}
}
