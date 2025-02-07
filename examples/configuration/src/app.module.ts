import { ConfigxModule } from "@abinnovision/nestjs-configx";
import { Module } from "@nestjs/common";

import { AppConfigx } from "./app.configx";

@Module({
	imports: [ConfigxModule.register(AppConfigx)],
})
export class AppModule {}
