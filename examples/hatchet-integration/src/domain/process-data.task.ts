import {
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
	public async task(ctx: TaskCtx<typeof this>) {
		return {
			result: ctx.input.data,
		};
	}
}

@Host({
	name: "process-data-workflow",
	onEvents: [""],
})
export class ProcessDataWorkflow extends workflowHost(
	z.object({ data: z.string() }),
) {
	@WorkflowTask<typeof ProcessDataWorkflow>({ parents: [] })
	public async cleanUpData(ctx: WorkflowCtx<typeof this>) {
		console.log("Access to workflow input", ctx.input);

		return {
			output: ctx.input.data,
		};
	}

	@WorkflowTask<typeof ProcessDataWorkflow>({ parents: ["cleanUpData"] })
	public async processData(ctx: WorkflowCtx<typeof this>) {
		console.log("Access to workflow input", ctx.input.data);

		const result = await ctx.parent(this.cleanUpData);

		const runResult = await ctx.run(
			taskRef(ProcessDataTask, "task"),
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
		const parent = await ctx.parent(this.processData);

		return {
			resultData: parent.processResult,
		};
	}
}

// const _refWorkflow = workflowRef(ProcessDataWorkflow);
// const _refWorkflowTask = workflowTaskRef(ProcessDataWorkflow, "cleanUpData");
// const _refTask = taskRef(ProcessDataTask, "task");
//
// const RefTaskOutput: (typeof _refTask)["__types"]["output"] = {} as any;
// const RefTaskInput: (typeof _refTask)["__types"]["input"] = {} as any;
// const RefWorkflowOutput: (typeof _refWorkflow)["__types"]["output"] = {} as any;
// const RefWorkflowTaskOutput: (typeof _refWorkflowTask)["__types"]["output"] =
// 	{} as any;
// const RefWorkflowTaskInput: (typeof _refWorkflowTask)["__types"]["input"] =
// 	{} as any;
//
// console.log([
// 	RefWorkflowOutput.transformOutputData.resultData,
// 	RefWorkflowOutput.cleanUpData.output,
// 	RefWorkflowOutput.processData.processResult,
// ]);
//
// console.log(RefTaskInput.data);
// console.log(RefTaskOutput.result);
//
// console.log(RefWorkflowTaskInput.data);
// console.log(RefWorkflowTaskOutput.output);
