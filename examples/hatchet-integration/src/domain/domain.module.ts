import {
	HatchetModule,
	taskRef,
	workflowRef,
} from "@abinnovision/nestjs-hatchet";
import { Module } from "@nestjs/common";

import { DomainController } from "./domain.controller";
import { ProcessDataTask, ProcessDataWorkflow } from "./process-data.task";

@Module({
	imports: [
		// Register the worker for the domain.
		HatchetModule.forFeature(
			workflowRef(ProcessDataWorkflow),
			taskRef(ProcessDataTask),
		),
	],
	controllers: [DomainController],
})
export class DomainModule {}
