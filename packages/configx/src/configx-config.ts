import { applyDecorators, Inject } from "@nestjs/common";

import type { ConfigxZodObject } from "./types";

export class ConfigxConfig<S extends ConfigxZodObject> {
	public readonly id: string;
	public readonly schema: S;

	private readonly injectionToken: symbol;

	public constructor(args: { id?: string; schema: S }) {
		this.injectionToken = Symbol(`configx:config:${args.id ?? "default"}`);

		this.id = args.id ?? "default";
		this.schema = args.schema;
	}

	public Inject(): PropertyDecorator & ParameterDecorator {
		return applyDecorators(Inject(this.token));
	}

	public get token() {
		return this.injectionToken;
	}
}
