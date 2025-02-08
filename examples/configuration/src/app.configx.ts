import { configx } from "@abinnovision/nestjs-configx";
import { z } from "zod";

export class AppConfigx extends configx(
	z.object({
		PORT: z.string().transform(Number).pipe(z.number().default(3000)),
		HOST: z.string().default("0.0.0.0"),
		CORS_ALLOWED_ORIGINS: z
			.string()
			.transform((it) => it.split(","))
			.pipe(z.string().array().default(["*"])),
	}),
) {}
