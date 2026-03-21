import {
	HatchetModule,
	taskRef,
	workflowRef,
} from "@abinnovision/nestjs-hatchet";
import { Module } from "@nestjs/common";

import { DomainController } from "./domain.controller";
import { EventHandlerWorkflow } from "./event-handler.workflow";
import { ProcessDataTask, ProcessDataWorkflow } from "./process-data.task";

@Module({
	imports: [
		HatchetModule.forFeature(
			workflowRef(ProcessDataWorkflow),
			taskRef(ProcessDataTask),

			// Event-triggered workflow
			workflowRef(EventHandlerWorkflow),
		),
	],

	// Hosts must be provided in the module so their dependencies resolve correctly.
	providers: [ProcessDataWorkflow, ProcessDataTask, EventHandlerWorkflow],
	controllers: [DomainController],
})
export class DomainModule {}
