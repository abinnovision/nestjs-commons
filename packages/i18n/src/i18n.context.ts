import { Injectable } from "@nestjs/common";
import { AsyncLocalStorage } from "node:async_hooks";

import type { I18nRequest } from "./i18n.module-config.js";
import type { Locale } from "./i18n.registry.js";

/**
 * The async context of a request or an `I18nService.run()` call.
 */
export interface I18nStore {
	request?: I18nRequest | undefined;
	locale?: Locale | undefined;
}

/**
 * Holds the async context used to resolve the current locale.
 */
@Injectable()
export class I18nContext {
	private readonly storage = new AsyncLocalStorage<I18nStore>();

	public get store(): I18nStore | undefined {
		return this.storage.getStore();
	}

	public run<T>(store: I18nStore, fn: () => T): T {
		return this.storage.run(store, fn);
	}
}
