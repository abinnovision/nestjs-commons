import { Global, Module } from "@nestjs/common";

import { DefaultDisk } from "./default-disk.js";
import { DiskRegistry } from "./disk-registry.js";
import { FlydriveTester } from "./flydrive-tester.js";
import { flydriveModuleConfigToken } from "./flydrive.module-config.js";
import { buildPerDiskProviders } from "./internal/per-disk-providers.js";
import {
	assertDefaultInDisks,
	assertDriversMatchDisks,
	assertNoDuplicateRefs,
} from "./internal/validation.js";

import type { DiskRefClass } from "./disk-ref.js";
import type {
	FlydriveModuleAsyncOptions,
	FlydriveModuleOptions,
	ResolvedFlydriveConfig,
} from "./flydrive.module-config.js";
import type { DynamicModule, Provider } from "@nestjs/common";

/**
 * Create a `useExisting` alias so injecting {@link DefaultDisk} resolves to
 * the same instance as the user's chosen `default` ref class.
 */
function defaultDiskAliasProvider(defaultRef: DiskRefClass): Provider {
	return { provide: DefaultDisk, useExisting: defaultRef };
}

/**
 * NestJS module wrapping the `flydrive` library with class-token DI.
 *
 * Disks are declared via classes produced by `defineDisk()` and registered
 * with this module via `forRoot` or `forRootAsync`. Injecting the class
 * directly resolves to the matching `Disk` instance:
 *
 * ```ts
 * class UploadsDisk extends defineDisk() {}
 *
 * @Module({
 *   imports: [
 *     FlydriveModule.forRoot({
 *       default: UploadsDisk,
 *       disks: [{ ref: UploadsDisk, driver: () => new FSDriver(...) }],
 *     }),
 *   ],
 * })
 * export class AppModule {}
 *
 * @Injectable()
 * export class UploadService {
 *   constructor(private readonly uploads: UploadsDisk) {}
 * }
 * ```
 *
 * The module is `@Global()`. Registering it once at the root makes every
 * disk ref class and the {@link DefaultDisk} alias available across the
 * application without re-importing.
 */
@Global()
@Module({})
export class FlydriveModule {
	/**
	 * Register the module with a synchronously-known set of disks.
	 *
	 * Use this when driver construction does not depend on any other
	 * Nest-managed service; otherwise prefer {@link FlydriveModule.forRootAsync}.
	 */
	public static forRoot<const Refs extends readonly DiskRefClass[]>(
		options: FlydriveModuleOptions<Refs>,
	): DynamicModule {
		const refs = options.disks.map((entry) => entry.ref);

		assertNoDuplicateRefs(refs);
		assertDefaultInDisks(options.default, refs);

		const resolved: ResolvedFlydriveConfig = {
			default: options.default,
			disks: options.disks,
		};

		return {
			module: FlydriveModule,
			global: true,
			providers: [
				{ provide: flydriveModuleConfigToken, useValue: resolved },
				DiskRegistry,
				...buildPerDiskProviders(refs),
				defaultDiskAliasProvider(options.default),
				FlydriveTester,
			],
			exports: [
				DiskRegistry,
				DefaultDisk,
				FlydriveTester,
				flydriveModuleConfigToken,
				...refs,
			],
		};
	}

	/**
	 * Register the module with driver builders that are resolved from a
	 * Nest-managed dependency (e.g. a configuration service).
	 *
	 * The ref classes themselves are passed statically in `disks` because
	 * Nest needs to register a provider per class at module-definition time,
	 * before the async factory runs. The factory must then return one
	 * driver builder per declared ref. Mismatches throw synchronously,
	 * before the resolved configuration is published to the DI container.
	 */
	public static forRootAsync<const Refs extends readonly DiskRefClass[]>(
		options: FlydriveModuleAsyncOptions<Refs>,
	): DynamicModule {
		const refs = [...options.disks];

		assertNoDuplicateRefs(refs);
		assertDefaultInDisks(options.default, refs);

		const userFactory = options.useFactory;

		const configProvider: Provider = {
			provide: flydriveModuleConfigToken,
			useFactory: async (
				...deps: readonly unknown[]
			): Promise<ResolvedFlydriveConfig> => {
				const result = await userFactory(...(deps as unknown[]));

				assertDriversMatchDisks(refs, result.drivers);

				return {
					default: options.default,
					disks: result.drivers,
				};
			},
			inject: options.inject ?? [],
		};

		return {
			module: FlydriveModule,
			global: true,
			imports: options.imports ?? [],
			providers: [
				configProvider,
				DiskRegistry,
				...buildPerDiskProviders(refs),
				defaultDiskAliasProvider(options.default),
				FlydriveTester,
			],
			exports: [
				DiskRegistry,
				DefaultDisk,
				FlydriveTester,
				flydriveModuleConfigToken,
				...refs,
			],
		};
	}
}
