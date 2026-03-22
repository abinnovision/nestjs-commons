import { defineConfig } from "tsdown";
import swc from "unplugin-swc";

export default defineConfig({
	entry: ["src/index.ts", "src/sdk-export/index.ts"],
	unbundle: true,
	format: ["cjs", "esm"],
	clean: true,
	deps: { skipNodeModulesBundle: true },
	plugins: [swc.rolldown()],

	/*
	 * Disabled due to a bug in rolldown-plugin-dts with TypeScript 5.9.
	 * Its stripPrivateFields transformer crashes on getter accessor declarations.
	 * Declarations are generated via tsc --emitDeclarationOnly in the build script instead.
	 */
	dts: false,
});
