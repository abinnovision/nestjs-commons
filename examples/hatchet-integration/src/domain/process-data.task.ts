import {
	CtxTask,
	CtxWorkflow,
	Host,
	Task,
	TaskHost,
	taskRef,
	WorkflowHost,
	WorkflowTask,
} from "@abinnovision/nestjs-hatchet";
import { z } from "zod";

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type ProcessDataTaskInput = {
	data: string;
};

@Host({ name: "process-data" })
export class ProcessDataTask extends TaskHost<ProcessDataTaskInput> {
	@Task({})
	public async task(ctx: CtxTask<typeof this>) {
		return {
			result: ctx.input.data,
		};
	}

	public override inputSchema() {
		return z.object({
			data: z.string(),
		});
	}
}

@Host({
	name: "process-data-workflow",
	onEvents: [""],
})
export class ProcessDataWorkflow extends WorkflowHost<{ data: string }> {
	@WorkflowTask<typeof ProcessDataWorkflow>({
		parents: [],
	})
	public async cleanUpData(ctx: CtxWorkflow<typeof this>) {
		console.log("Access to workflow input", ctx.input);

		return {
			output: ctx.input.data,
		};
	}

	@WorkflowTask<typeof ProcessDataWorkflow>({ parents: ["cleanUpData"] })
	public async processData(ctx: CtxWorkflow<typeof this>) {
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
	public async transformOutputData(ctx: CtxWorkflow<typeof this>) {
		const parent = await ctx.parent(this.processData);

		return {
			resultData: parent.processResult,
		};
	}

	public override inputSchema() {
		return z.object({
			data: z.string(),
		});
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
