import { Injectable, Logger } from "@nestjs/common";
import { DiscoveryService } from "@nestjs/core";
import { InstanceWrapper } from "@nestjs/core/injector/instance-wrapper";
import { Module } from "@nestjs/core/injector/module";

import { DiscoveryCompWorkflow } from "../internal";
import { AnyCallableRef, AnyHost } from "../ref";

/**
 * Service that provides utilities for exploring the host providers.
 */
@Injectable()
export class HostExplorerService {
	private static LOGGER = new Logger(HostExplorerService.name);

	public constructor(private readonly discovery: DiscoveryService) {}

	/**
	 * Collects all the workflow providers available in the current application.
	 *
	 * @returns An async generator that yields the host providers.
	 */
	public getHostInModuleByRef(
		module: Module,
		refs: AnyCallableRef,
	): InstanceWrapper<AnyHost> | undefined {
		const providers = this.discovery.getProviders(
			{ metadataKey: DiscoveryCompWorkflow.KEY },
			[module],
		);

		HostExplorerService.LOGGER.debug(
			`Found ${providers.length} host providers`,
		);

		for (const provider of providers) {
			if (provider.instance instanceof refs.host) {
				return provider;
			}
		}

		return undefined;
	}
}
