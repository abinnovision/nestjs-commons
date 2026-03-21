import swc from "unplugin-swc";
import { defineConfig } from "tsdown";

export default defineConfig({
	attw: true,
	publint: true,
	unbundle: true,
	format: ["cjs", "esm"],
	clean: true,
	deps: { skipNodeModulesBundle: true },
	plugins: [swc.rollup()],
});
