import { ExceptionLocalizer } from "@abinnovision/nestjs-exceptions";
import { EntityFocusedAppException } from "@abinnovision/nestjs-exceptions/entity";
import { Inject, Injectable, Logger } from "@nestjs/common";

import { i18nModuleConfigToken } from "../i18n.module-config.js";
import { I18nService } from "../i18n.service.js";

import type { I18nModuleConfig, I18nRequest } from "../i18n.module-config.js";
import type { MessageValue } from "../i18n.registry.js";
import type { TranslateOptions } from "../i18n.service.js";
import type { LocalizableError } from "@abinnovision/nestjs-exceptions";
import type { ArgumentsHost } from "@nestjs/common";

type LooseTranslate = (
	key: string,
	params?: Record<string, MessageValue>,
	opts?: TranslateOptions,
) => string;

/**
 * Localizes exception details with the `exceptions.<CODE>` messages.
 *
 * The exception `meta` is used as message parameters. Entity-focused
 * exceptions also get an `entity` parameter, translated with the
 * `entities.<name>` message or the raw entity name.
 *
 * Never throws: a missing message or a formatting error keeps the original
 * detail.
 */
@Injectable()
export class I18nExceptionLocalizer extends ExceptionLocalizer {
	private readonly logger = new Logger(I18nExceptionLocalizer.name);

	public constructor(
		@Inject(I18nService) private readonly i18n: I18nService,
		@Inject(i18nModuleConfigToken) private readonly config: I18nModuleConfig,
	) {
		super();
	}

	public localize(
		error: LocalizableError,
		host: ArgumentsHost,
	): string | undefined {
		try {
			const key = `exceptions.${error.code}`;

			if (!this.hasMessage(key)) {
				this.logger.debug(`No message for exception code '${error.code}'`);

				return undefined;
			}

			const request = this.requestOf(host);
			const locale = request
				? this.i18n.resolveLocale(request)
				: this.i18n.locale;
			const t = this.i18n.t.bind(this.i18n) as LooseTranslate;
			const params: Record<string, MessageValue> = {
				...(typeof error.meta === "object" ? error.meta : {}),
			};

			if (error.exception instanceof EntityFocusedAppException) {
				const entityKey = `entities.${error.exception.entity}`;

				params["entity"] = this.hasMessage(entityKey)
					? t(entityKey, {}, { locale })
					: error.exception.entity;
			}

			return t(key, params, { locale });
		} catch (localizeError) {
			this.logger.warn(localizeError, "Failed to localize exception");

			return undefined;
		}
	}

	private hasMessage(key: string): boolean {
		const catalogs = this.config.catalogs as Record<
			string,
			Record<string, string>
		>;

		return Object.hasOwn(catalogs[this.config.defaultLocale] ?? {}, key);
	}

	private requestOf(host: ArgumentsHost): I18nRequest | undefined {
		const type = host.getType<string>();

		if (type === "http") {
			return host.switchToHttp().getRequest<I18nRequest>();
		}

		if (type === "graphql") {
			const context = host.getArgByIndex<
				{ req?: I18nRequest; request?: I18nRequest } | undefined
			>(2);

			return context?.req ?? context?.request;
		}

		return undefined;
	}
}
