import { ConfigxModule } from "@abinnovision/nestjs-configx";
import { Module } from "@nestjs/common";

import { AppConfigx } from "./app.configx";
import { ProcessDataWorkflow } from "./tasks/process-data.task";

@Module({
	imports: [ConfigxModule.register(AppConfigx)],
	providers: [ProcessDataWorkflow],
})
export class AppModule {}
