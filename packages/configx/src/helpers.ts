import { ConfigxConfig } from "./configx-config";

import type { ConfigxZodObject } from "./types";

interface DefineConfigArgs<S extends ConfigxZodObject> {
	id?: string;
	schema: S;
}

export const defineConfigx = <S extends ConfigxZodObject>(
	args: DefineConfigArgs<S>,
): ConfigxConfig<S> => new ConfigxConfig<S>(args);
