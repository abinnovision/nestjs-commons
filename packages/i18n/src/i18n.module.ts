import {
	ConfigurableModuleBuilder,
	Global,
	Inject,
	Module,
} from "@nestjs/common";

import { I18nContext } from "./i18n.context.js";
import { I18nMiddleware } from "./i18n.middleware.js";
import { i18nModuleConfigToken } from "./i18n.module-config.js";
import { I18nService } from "./i18n.service.js";

import type { I18nModuleConfig } from "./i18n.module-config.js";
import type { MiddlewareConsumer, NestModule } from "@nestjs/common";

const { ConfigurableModuleClass } =
	new ConfigurableModuleBuilder<I18nModuleConfig>({
		optionsInjectionToken: i18nModuleConfigToken,
		moduleName: "I18nModule",
	})
		.setClassMethodName("forRoot")
		.setExtras({}, (definition) => ({ ...definition, global: true }))
		.build();

@Global()
@Module({
	providers: [I18nContext, I18nService],
	exports: [I18nService, i18nModuleConfigToken],
})
export class I18nModule extends ConfigurableModuleClass implements NestModule {
	public constructor(
		@Inject(i18nModuleConfigToken) private readonly config: I18nModuleConfig,
	) {
		super();

		if (!Object.hasOwn(config.catalogs, config.defaultLocale)) {
			throw new Error(
				`Default locale '${config.defaultLocale}' has no catalog`,
			);
		}
	}

	public configure(consumer: MiddlewareConsumer): void {
		if (this.config.middleware !== false) {
			consumer.apply(I18nMiddleware).forRoutes("{*path}");
		}
	}
}
