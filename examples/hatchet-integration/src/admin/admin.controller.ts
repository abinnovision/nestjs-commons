import { Client, taskRef } from "@abinnovision/nestjs-hatchet";
import { Controller, Get } from "@nestjs/common";

import { ProcessDataTask } from "../domain/process-data.task";

@Controller("admin")
export class AdminController {
	public constructor(private readonly client: Client) {}

	@Get()
	public async cleanup() {
		return await this.client.run(taskRef(ProcessDataTask, "task"), {
			data: "admin",
		});
	}
}
