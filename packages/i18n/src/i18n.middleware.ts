import { Inject, Injectable } from "@nestjs/common";

import { I18nService } from "./i18n.service.js";

import type { I18nRequest } from "./i18n.module-config.js";
import type { NestMiddleware } from "@nestjs/common";

/**
 * Runs the rest of the request inside an i18n context holding the request.
 */
@Injectable()
export class I18nMiddleware implements NestMiddleware {
	public constructor(@Inject(I18nService) private readonly i18n: I18nService) {}

	public use(request: I18nRequest, _response: unknown, next: () => void): void {
		this.i18n.runForRequest(request, next);
	}
}
