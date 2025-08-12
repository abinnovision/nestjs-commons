import { NestFactory } from "@nestjs/core";

import { AppConfigx } from "./app.configx";
import { AppModule } from "./app.module";

async function bootstrap() {
	const app = await NestFactory.create(AppModule, {
		bufferLogs: true,
	});

	// Disable the X-Powered-By header to not expose information about the server
	app.getHttpAdapter().getInstance().disable("x-powered-by");

	// Using the enableShutdownHooks method,
	// the application will gracefully shut down
	// when the process receives a termination signal.
	app.enableShutdownHooks();

	// Get the config for the application.
	const appConfig = app.get(AppConfigx);

	// Start the server.
	await app.listen(appConfig.PORT, appConfig.HOST);
}

bootstrap().catch(console.error);
