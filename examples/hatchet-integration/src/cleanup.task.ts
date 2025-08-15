import { CtxTask, Host, Task, TaskHost } from "@abinnovision/nestjs-hatchet";

@Host({ name: "cleanup-common" })
export class CleanupTask extends TaskHost<{}> {
	@Task({})
	public async task(_ctx: CtxTask<typeof this>) {
		return {
			result: "cleanup-common",
		};
	}
}
