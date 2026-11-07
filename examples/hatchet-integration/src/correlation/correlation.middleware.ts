import { Injectable, NestMiddleware } from "@nestjs/common";
import { randomUUID } from "node:crypto";

import { correlationStorage } from "./correlation.context";

import type { NextFunction, Request, Response } from "express";

/**
 * Example middleware that runs each HTTP request inside a correlation context.
 * Uses the `x-correlation-id` header if present, otherwise generates a new id.
 */
@Injectable()
export class CorrelationMiddleware implements NestMiddleware {
	public use(req: Request, res: Response, next: NextFunction) {
		const correlationId = req.header("x-correlation-id") ?? randomUUID();

		res.setHeader("x-correlation-id", correlationId);
		correlationStorage.run({ correlationId }, next);
	}
}
