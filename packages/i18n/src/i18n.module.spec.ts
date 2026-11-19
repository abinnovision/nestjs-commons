import {
	Controller,
	Get,
	Inject,
	Injectable,
	Logger,
	Module,
	UseGuards,
} from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { afterEach, describe, expect, expectTypeOf, it, vi } from "vitest";

import { de, en } from "./__fixtures__/catalogs.js";
import { i18nModuleConfigToken } from "./i18n.module-config.js";
import { I18nModule } from "./i18n.module.js";
import { I18nService } from "./i18n.service.js";
import { acceptLanguage, fromRequest } from "./resolvers.js";

import type { I18nModuleConfig, I18nRequest } from "./i18n.module-config.js";
import type {
	CanActivate,
	ExecutionContext,
	INestApplication,
} from "@nestjs/common";

/** Simulates an auth guard that sets `req.user` after the middleware ran. */
@Injectable()
class UserGuard implements CanActivate {
	public canActivate(context: ExecutionContext): boolean {
		context.switchToHttp().getRequest<{ user?: object }>().user = {
			locale: "de",
		};

		return true;
	}
}

@Controller()
class GreetingController {
	public constructor(@Inject(I18nService) private readonly i18n: I18nService) {}

	@Get("greeting")
	public greeting(): string {
		return this.i18n.t("greeting", { name: "Ada" });
	}

	@Get("user")
	@UseGuards(UserGuard)
	public user(): string {
		return this.i18n.t("farewell");
	}
}

@Module({
	providers: [{ provide: "CONFIG", useValue: { lang: "en" } }],
	exports: ["CONFIG"],
})
class ConfigModule {}

const config: I18nModuleConfig = {
	defaultLocale: "en",
	catalogs: { en, de },
	resolvers: [
		fromRequest(
			(request: { user?: { locale: string } }) => request.user?.locale,
		),
		acceptLanguage(),
	],
};

let app: INestApplication | undefined;

async function start(
	module: ReturnType<typeof I18nModule.forRoot>,
	setup?: (app: INestApplication) => void,
) {
	const moduleRef = await Test.createTestingModule({
		imports: [module],
		controllers: [GreetingController],
	}).compile();

	app = moduleRef.createNestApplication({ logger: false });
	setup?.(app);
	await app.listen(0, "127.0.0.1");

	const url = await app.getUrl();

	return async (path: string, headers: Record<string, string> = {}) =>
		await (await fetch(`${url}${path}`, { headers })).text();
}

afterEach(async () => {
	await app?.close();
	app = undefined;
	vi.restoreAllMocks();
});

describe("i18nModule", () => {
	it("resolves I18nService with forRoot", async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [I18nModule.forRoot(config)],
		}).compile();

		expect(moduleRef.get(I18nService).t("farewell")).toBe("Goodbye");
	});

	it("resolves I18nService with forRootAsync", async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [
				I18nModule.forRootAsync({
					imports: [ConfigModule],
					inject: ["CONFIG"],
					useFactory: (cfg: { lang: string }) => ({
						...config,
						defaultLocale: cfg.lang as "en",
					}),
				}),
			],
		}).compile();

		expect(moduleRef.get(I18nService).t("farewell")).toBe("Goodbye");
		expect(moduleRef.get(i18nModuleConfigToken)).toMatchObject({
			defaultLocale: "en",
		});
	});

	it("throws when the default locale has no catalog", async () => {
		await expect(
			Test.createTestingModule({
				imports: [
					I18nModule.forRoot({
						...config,
						defaultLocale: "fr" as "en",
					}),
				],
			}).compile(),
		).rejects.toThrow("Default locale 'fr' has no catalog");
	});

	it("resolves the request locale through the middleware", async () => {
		const warn = vi.spyOn(Logger.prototype, "warn");
		const get = await start(I18nModule.forRoot(config));

		expect(
			await get("/greeting", { "accept-language": "de-AT,de;q=0.9" }),
		).toBe("Hallo Ada");
		expect(await get("/greeting")).toBe("Hello Ada");
		expect(warn).not.toHaveBeenCalled();
	});

	it("picks up req.user set after the middleware", async () => {
		const get = await start(I18nModule.forRoot(config));

		expect(await get("/user", { "accept-language": "en" })).toBe(
			"Auf Wiedersehen",
		);
	});

	it("skips the middleware with middleware: false", async () => {
		const get = await start(
			I18nModule.forRoot({ ...config, middleware: false }),
		);

		expect(await get("/greeting", { "accept-language": "de" })).toBe(
			"Hello Ada",
		);
	});

	it("skips the middleware with middleware: false via forRootAsync", async () => {
		const get = await start(
			I18nModule.forRootAsync({
				useFactory: () => ({ ...config, middleware: false }),
			}),
		);

		expect(await get("/greeting", { "accept-language": "de" })).toBe(
			"Hello Ada",
		);
	});

	describe("handlers outside Nest", () => {
		const setup = (nestApp: INestApplication) => {
			const i18n = nestApp.get(I18nService);

			nestApp.use((req: I18nRequest, _res: unknown, next: () => void) => {
				i18n.runForRequest(req, next);
			});
			nestApp
				.getHttpAdapter()
				.get(
					"/raw",
					async (_req: unknown, res: { send: (body: string) => void }) => {
						await Promise.resolve();
						res.send(i18n.t("farewell"));
					},
				);
		};

		it("resolves the locale with runForRequest", async () => {
			const get = await start(I18nModule.forRoot(config), setup);

			expect(await get("/raw", { "accept-language": "de" })).toBe(
				"Auf Wiedersehen",
			);
		});

		it("resolves the locale with middleware: false", async () => {
			const get = await start(
				I18nModule.forRoot({ ...config, middleware: false }),
				setup,
			);

			expect(await get("/raw", { "accept-language": "de" })).toBe(
				"Auf Wiedersehen",
			);
		});
	});

	it("checks catalogs and locales at compile time", () => {
		const deMissing = { greeting: "Hallo {name}" };

		expectTypeOf({ en, de: deMissing }).not.toExtend<
			I18nModuleConfig["catalogs"]
		>();
		expectTypeOf<"fr">().not.toExtend<I18nModuleConfig["defaultLocale"]>();
	});
});
