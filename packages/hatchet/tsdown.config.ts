import { defineConfig } from "tsdown";
import swc from "unplugin-swc";

export default defineConfig({
	unbundle: true,
	dts: false,
	format: ["cjs", "esm"],
	clean: true,
	deps: { skipNodeModulesBundle: true },
	plugins: [swc.rollup()],
});
