import { Inject, Injectable, Logger } from "@nestjs/common";

import { I18nContext } from "./i18n.context.js";
import { i18nModuleConfigToken } from "./i18n.module-config.js";
import { compileMessage } from "./internal/formatter.js";
import { negotiateLocale } from "./internal/negotiate.js";
import { acceptLanguage } from "./resolvers.js";

import type {
	I18nModuleConfig,
	I18nRequest,
	LocaleResolver,
} from "./i18n.module-config.js";
import type {
	Locale,
	MessageKey,
	MessageParams,
	MessageValue,
} from "./i18n.registry.js";
import type { CompiledMessage } from "./internal/formatter.js";

type TranslateArgs<K extends MessageKey> =
	Record<never, never> extends MessageParams<K>
		? [params?: MessageParams<K>, opts?: TranslateOptions]
		: [params: MessageParams<K>, opts?: TranslateOptions];

/**
 * Options for a single translation.
 */
export interface TranslateOptions {
	/**
	 * Overrides the locale of the current context.
	 */
	locale?: Locale | undefined;
}

/**
 * Translates messages of the configured catalogs.
 *
 * The locale is taken from `opts.locale`, then from `run()`, then resolved
 * from the current request, then the default locale. It is resolved on
 * every call, so values set later in the request (e.g. `req.user`) apply.
 */
@Injectable()
export class I18nService {
	private readonly logger = new Logger(I18nService.name);
	private readonly formatters = new Map<string, CompiledMessage>();
	private readonly locales: readonly string[];
	private readonly resolvers: readonly LocaleResolver[];

	public constructor(
		@Inject(i18nModuleConfigToken) private readonly config: I18nModuleConfig,
		@Inject(I18nContext) private readonly context: I18nContext,
	) {
		this.locales = Object.keys(config.catalogs);
		this.resolvers = config.resolvers ?? [acceptLanguage()];
	}

	/**
	 * The locale of the current context.
	 */
	public get locale(): Locale {
		const store = this.context.store;

		if (store?.locale !== undefined) {
			return store.locale;
		}

		if (store?.request !== undefined) {
			return this.resolveLocale(store.request);
		}

		return this.config.defaultLocale;
	}

	/**
	 * Translates a message. A key missing in the locale falls back to the
	 * default locale; a key missing there is returned as is.
	 */
	public t<K extends MessageKey>(key: K, ...args: TranslateArgs<K>): string {
		const [params, opts] = args;

		const locale =
			opts?.locale === undefined ? this.locale : this.negotiate(opts.locale);

		return this.format(locale, key, params);
	}

	/**
	 * Runs `fn` with the given locale as the context locale.
	 */
	public run<T>(locale: Locale, fn: () => T): T {
		return this.context.run(
			{ ...this.context.store, locale: this.negotiate(locale) },
			fn,
		);
	}

	/**
	 * Resolves the locale of a request with the configured resolvers.
	 */
	public resolveLocale(request: I18nRequest): Locale {
		for (const resolver of this.resolvers) {
			const result = resolver(request);
			const candidates = typeof result === "string" ? [result] : result;
			const locale = candidates
				? negotiateLocale(candidates, this.locales)
				: undefined;

			if (locale !== undefined) {
				return locale as Locale;
			}
		}

		return this.config.defaultLocale;
	}

	private negotiate(locale: string): Locale {
		return (negotiateLocale([locale], this.locales) ??
			this.config.defaultLocale) as Locale;
	}

	private format(
		locale: string,
		key: string,
		params: Record<string, MessageValue> | undefined,
	): string {
		const catalogs = this.config.catalogs as Record<
			string,
			Record<string, string> | undefined
		>;
		let target = locale;
		let message = catalogs[locale]?.[key];

		if (message === undefined) {
			target = this.config.defaultLocale;
			message = catalogs[target]?.[key];
		}

		if (message === undefined) {
			this.logger.warn(`Message '${key}' is missing in the default locale`);

			return key;
		}

		const cacheKey = `${target}\u0000${key}`;
		let formatter = this.formatters.get(cacheKey);

		if (!formatter) {
			formatter = compileMessage(message, target);
			this.formatters.set(cacheKey, formatter);
		}

		return formatter.format(params);
	}
}
