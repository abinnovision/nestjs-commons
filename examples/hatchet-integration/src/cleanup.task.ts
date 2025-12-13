import { CtxTask, Host, Task, taskHost } from "@abinnovision/nestjs-hatchet";

@Host({ name: "cleanup-common" })
export class CleanupTask extends taskHost() {
	@Task({})
	public async task(_ctx: CtxTask<typeof this>) {
		return {
			result: "cleanup-common",
		};
	}
}
