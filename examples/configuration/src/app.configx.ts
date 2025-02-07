import { configx } from "@abinnovision/nestjs-configx";
import { z } from "zod";

export class AppConfigx extends configx({
	PORT: z.number().default(3000),
}) {}
