import { Host, Task, TaskCtx, taskHost } from "@abinnovision/nestjs-hatchet";

@Host({ name: "cleanup-common" })
export class CleanupTask extends taskHost() {
	@Task({})
	public async task(_ctx: TaskCtx<typeof this>) {
		return {
			result: "cleanup-common",
		};
	}
}
