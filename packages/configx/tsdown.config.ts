import { defineConfig } from "tsdown";
import swc from "unplugin-swc";

export default defineConfig({
	attw: true,
	publint: true,
	unbundle: true,
	format: ["cjs", "esm"],
	clean: true,
	deps: { skipNodeModulesBundle: true },
	plugins: [swc.rolldown()],
});
