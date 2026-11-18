import { Inject, Injectable } from "@nestjs/common";

import { I18nContext } from "./i18n.context.js";

import type { I18nRequest } from "./i18n.module-config.js";
import type { NestMiddleware } from "@nestjs/common";

/**
 * Runs the rest of the request inside an i18n context holding the request.
 */
@Injectable()
export class I18nMiddleware implements NestMiddleware {
	public constructor(
		@Inject(I18nContext) private readonly context: I18nContext,
	) {}

	public use(request: I18nRequest, _response: unknown, next: () => void): void {
		this.context.run({ request }, next);
	}
}
