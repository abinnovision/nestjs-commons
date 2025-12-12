import { Module } from "@nestjs/common";

import { AppConfigx } from "./app.configx";

@Module({
	providers: [AppConfigx],
	exports: [AppConfigx],
})
export class AppModule {}
