import { defineConfig } from "tsdown";
import swc from "unplugin-swc";

export default defineConfig({
	// sdk-export is a standalone export which holds the full Hatchet SDK.
	entry: ["src/index.ts", "src/sdk-export/index.ts"],
	unbundle: true,
	dts: false,
	format: ["cjs", "esm"],
	clean: true,
	deps: { skipNodeModulesBundle: true },
	plugins: [swc.rollup()],
});
