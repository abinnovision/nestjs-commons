import { Client, workflowRef } from "@abinnovision/nestjs-hatchet";
import { Controller, Get } from "@nestjs/common";

import { ProcessDataWorkflow } from "./process-data.task";

@Controller("domain")
export class DomainController {
	public constructor(private readonly client: Client) {}

	@Get("process-data")
	public async processData(data: string) {
		return await this.client.run(
			workflowRef(ProcessDataWorkflow),
			{ data },
			{ wait: true },
		);
	}
}
