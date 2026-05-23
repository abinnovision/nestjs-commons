import type { DiskRefClass } from "./disk-ref.js";
import type { FactoryProvider, ModuleMetadata } from "@nestjs/common";
import type { DriverContract } from "flydrive/types";

/**
 * A single disk registration: which ref class identifies it, and how to
 * build its underlying flydrive driver.
 */
export interface FlydriveDiskEntry<Refs extends readonly DiskRefClass[]> {
	/**
	 * Disk reference class. Must appear in the surrounding `disks` list.
	 */
	ref: Refs[number];

	/**
	 * Builder for the flydrive driver. Called at most once per disk: either
	 * eagerly during `onModuleInit` (default) or lazily on first resolution
	 * when `lazy: true`. Errors thrown here propagate to the application
	 * bootstrap.
	 */
	driver: () => DriverContract;
}

/**
 * Options accepted by `FlydriveModule.forRoot`.
 */
export interface FlydriveModuleOptions<Refs extends readonly DiskRefClass[]> {
	/**
	 * Disk to resolve when `DefaultDisk` is injected. Must be one of the
	 * classes in `disks`.
	 */
	default: Refs[number];

	/**
	 * Every disk the module should register.
	 */
	disks: readonly FlydriveDiskEntry<Refs>[];
}

/**
 * Shape returned by `FlydriveModule.forRootAsync`'s `useFactory`.
 */
export interface FlydriveAsyncFactoryResult<
	Refs extends readonly DiskRefClass[],
> {
	/**
	 * Driver builders for every disk declared in the outer options. The set
	 * of `ref`s must match the static `disks` list exactly; mismatches throw
	 * before the resolved config is published to the DI container.
	 */
	drivers: readonly FlydriveDiskEntry<Refs>[];
}

/**
 * Options accepted by `FlydriveModule.forRootAsync`.
 */
export interface FlydriveModuleAsyncOptions<
	Refs extends readonly DiskRefClass[],
> {
	/**
	 * Disk to resolve when `DefaultDisk` is injected. Must be one of the
	 * classes in `disks`.
	 */
	default: Refs[number];

	/**
	 * Disk reference classes registered with this module. Supplied
	 * statically because Nest needs to register a provider per class at
	 * module-definition time, before the async factory resolves.
	 */
	disks: Refs;

	imports?: ModuleMetadata["imports"];

	inject?: FactoryProvider["inject"];

	/**
	 * Builds the resolved driver list. Receives the dependencies declared in
	 * `inject` in the usual NestJS order. The returned `drivers` array must
	 * have exactly one entry per ref class in `disks`.
	 */
	useFactory: (
		...args: any[]
	) =>
		| Promise<FlydriveAsyncFactoryResult<Refs>>
		| FlydriveAsyncFactoryResult<Refs>;
}

/**
 * Resolved configuration shape stored under {@link flydriveModuleConfigToken}.
 *
 * Both sync and async paths normalise to this shape before publishing the
 * value to the DI container, so providers depending on the token see a
 * single, consistent type regardless of how the module was wired.
 */
export interface ResolvedFlydriveConfig {
	default: DiskRefClass;
	disks: ReadonlyArray<FlydriveDiskEntry<readonly DiskRefClass[]>>;
}

/**
 * DI token holding the resolved {@link ResolvedFlydriveConfig}.
 *
 * Exposed for advanced consumers (e.g. building custom providers on top of
 * the module). Most code should inject disk ref classes or
 * {@link DefaultDisk} instead.
 */
export const flydriveModuleConfigToken: unique symbol = Symbol(
	"flydrive:module:config",
);
