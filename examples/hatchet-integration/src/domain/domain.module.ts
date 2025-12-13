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
		// Register the worker for the domain.
		HatchetModule.forFeature(
			workflowRef(ProcessDataWorkflow),
			taskRef(ProcessDataTask),
			// Event-triggered workflow
			workflowRef(EventHandlerWorkflow),
		),
	],
	controllers: [DomainController],
})
export class DomainModule {}
