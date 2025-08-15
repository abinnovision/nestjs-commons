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
		HatchetModule.registerWorker({
			name: "domain-worker",
			workflows: [
				workflowRef(ProcessDataWorkflow),
				taskRef(ProcessDataTask, "task"),
			],
		}),
	],
	controllers: [DomainController],
})
export class DomainModule {}
